import {
  IFileRepository,
  IStorageService,
  IFolderRepository,
  IUserRepository,
} from '../../interfaces/index.js';
import { StorageTier } from '../../../../generated/prisma/index.js';

export interface InitiateUploadDTO {
  fileName: string;
  mimeType: string;
  size: bigint;
  folderId?: string | null;
  tier?: StorageTier;
  path?: string; // Optional path for recursive folder creation
}

export interface InitiateUploadResult {
  uploadId: string;
  parUrl: string;
  storageKey: string;
  fileName: string; // The final deduplicated filename
  ociUploadId?: string; // For chunked/resumable uploads
  isMultipart: boolean;
}

export class InitiateUploadUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: InitiateUploadDTO): Promise<InitiateUploadResult> {
    // 1. Validate User and Quota
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.storageUsed + dto.size > user.storageQuota) {
      throw new Error('Storage quota exceeded');
    }

    // 3. Handle Recursive Folder Creation if path provided
    let folderId = dto.folderId || null;
    if (dto.path) {
      folderId = await this.ensureFolderPath(userId, dto.path, folderId);
    }

    // 4. Filename Sanitization & Deduplication
    const sanitizedInputName = this.sanitizeFilename(dto.fileName);
    let finalName = sanitizedInputName;
    const existingFiles = await this.fileRepository.findAllByUserId(userId, {
      folderId: folderId,
      isDeleted: false,
    });

    const baseNameInput = finalName.split('.')[0] || '';
    const sameNameFiles = existingFiles.filter(f => f.name.startsWith(baseNameInput));
    if (sameNameFiles.length > 0) {
      const ext = finalName.includes('.') ? `.${finalName.split('.').pop()}` : '';
      const baseName = finalName.replace(ext, '');
      finalName = `${baseName} (${sameNameFiles.length})${ext}`;
    }

    // 5. Generate Storage Key
    const fileUuid = crypto.randomUUID();
    const storageKey = `${userId}/${fileUuid}-${finalName}`;

    // 6. Handle Large Files with Multipart Upload (optimized for pause/resume)
    const CHUNK_THRESHOLD = 10 * 1024 * 1024; // 10MB
    const isMultipart = dto.size > BigInt(CHUNK_THRESHOLD);
    let ociUploadId: string | undefined;

    if (isMultipart) {
      const multipart = await this.storageService.createMultipartUpload(
        storageKey,
        dto.mimeType,
        dto.tier
      );
      ociUploadId = multipart.uploadId;
    }

    // 7. Create PAR (optimized access type for multipart if needed)
    const { parUrl, parId } = await this.storageService.createPreAuthenticatedRequest({
      objectName: storageKey,
      accessType: isMultipart ? 'MultipartUploadWrite' : 'ObjectWrite',
      tier: dto.tier || StorageTier.STANDARD,
      expiresInHours: 24,
    });

    return {
      uploadId: parId,
      parUrl,
      storageKey,
      fileName: finalName,
      ociUploadId,
      isMultipart,
    };
  }

  private async ensureFolderPath(
    userId: string,
    path: string,
    rootFolderId: string | null
  ): Promise<string> {
    const segments = path.split('/').filter(s => s.length > 0);
    let currentParentId = rootFolderId;
    let currentPath = '';

    // If starting from a folder, get its path
    if (rootFolderId) {
      const rootFolder = await this.folderRepository.findById(rootFolderId);
      if (rootFolder) {
        currentPath = rootFolder.path;
      }
    }

    for (const segment of segments) {
      const existing = await this.folderRepository.findAllByUserId(userId, {
        parentId: currentParentId,
        isDeleted: false,
      });

      const found = existing.find(f => f.name === segment);
      if (found) {
        currentParentId = found.id;
        currentPath = found.path;
      } else {
        const nextPath = currentPath === '' ? segment : `${currentPath}/${segment}`;
        const newFolder = await this.folderRepository.create({
          userId,
          name: segment,
          parentId: currentParentId,
          path: nextPath,
        });
        currentParentId = newFolder.id;
        currentPath = newFolder.path;
      }
    }

    return currentParentId!;
  }

  /**
   * Enterprise Safety: Sanitize user-provided filename
   */
  private sanitizeFilename(filename: string): string {
    // Keep alphanumeric, dots, underscores, and hyphens.
    // Replace anything else (including path separators) with an underscore.
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }
}
