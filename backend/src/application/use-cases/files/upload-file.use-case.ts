import {
  IFileRepository,
  IStorageService,
  IFolderRepository,
  IUserRepository,
} from '../../interfaces/index.js';
import { File, StorageTier } from '../../../infrastructure/database/index.js';

export interface UploadFileDTO {
  file: Buffer;
  fileName: string;
  mimeType: string;
  size: bigint;
  folderId?: string | null;
  tier?: StorageTier;
  path?: string;
}

export class UploadFileUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: UploadFileDTO): Promise<File> {
    // 1. Validate User and Quota
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const currentUsed = user.storageUsed;
    const newUsed = currentUsed + dto.size;
    if (newUsed > user.storageQuota) {
      throw new Error('Storage quota exceeded');
    }

    // 2. Handle Recursive Folder Creation if path provided
    let folderId = dto.folderId || null;
    if (dto.path) {
      folderId = await this.ensureFolderPath(userId, dto.path, folderId);
    } else if (folderId) {
      // Validate folder exists if provided and no path
      const folder = await this.folderRepository.findById(folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error('Invalid destination folder');
      }
    }

    // 3. Filename Deduplication
    let finalName = dto.fileName;
    const exists = await this.fileRepository.existsByName(folderId, finalName, userId);
    if (exists) {
      const ext = finalName.includes('.') ? `.${finalName.split('.').pop()}` : '';
      const baseName = finalName.replace(ext, '');
      const timestamp = Math.floor(Date.now() / 1000);
      finalName = `${baseName}_${timestamp}${ext}`;
    }

    // 4. Generate Storage Key
    const fileUuid = crypto.randomUUID();
    const storageKey = `${userId}/${fileUuid}-${finalName}`;

    // 5. Upload to Storage
    const tier = dto.tier ?? StorageTier.STANDARD;

    await this.storageService.uploadFile({
      objectName: storageKey,
      file: dto.file,
      contentType: dto.mimeType,
      tier,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // 6. Generate Thumbnail
    let thumbnailKey: string | undefined = undefined;
    if (dto.mimeType.startsWith('image/')) {
      try {
        const thumbnailBuffer = await this.storageService.generateThumbnail(dto.file);
        thumbnailKey = `${userId}/thumbnails/${fileUuid}.webp`;
        await this.storageService.uploadFile({
          objectName: thumbnailKey,
          file: thumbnailBuffer,
          contentType: 'image/webp',
          tier: StorageTier.STANDARD,
        });
      } catch (error) {
        console.warn('Failed to generate thumbnail', error);
      }
    }

    // 7. Save to DB
    const file = await this.fileRepository.create({
      userId,
      folderId,
      name: finalName,
      storageKey,
      storageTier: tier,
      size: dto.size,
      mimeType: dto.mimeType,
      extension: dto.fileName.split('.').pop(),
      thumbnailKey,
      isOfflineAvailable: false,
    });

    // 8. Update User Storage Usage
    await this.userRepository.incrementStorageUsed(userId, dto.size);

    return file;
  }

  private async ensureFolderPath(
    userId: string,
    path: string,
    rootFolderId: string | null
  ): Promise<string> {
    const segments = path.split('/').filter(s => s.length > 0);
    let currentParentId = rootFolderId;
    let currentPath = '';

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
}
