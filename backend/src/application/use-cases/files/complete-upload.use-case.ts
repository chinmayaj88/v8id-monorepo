import { IFileRepository, IStorageService, IUserRepository } from '../../interfaces/index.js';
import { File, StorageTier } from '../../../infrastructure/database/index.js';

export interface CompleteUploadDTO {
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: bigint;
  folderId?: string | null;
  tier?: StorageTier;
  ociUploadId?: string;
  parts?: { partNumber: number; etag: string }[];
}

export class CompleteUploadUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: CompleteUploadDTO): Promise<File> {
    // 1. If Multipart, Commit it first
    if (dto.ociUploadId && dto.parts && dto.parts.length > 0) {
      // Enterprise Optimization: Ensure parts are sorted by partNumber
      // OCI strictly requires parts to be committed in order
      const sortedParts = [...dto.parts].sort((a, b) => a.partNumber - b.partNumber);

      await this.storageService.commitMultipartUpload(
        dto.ociUploadId,
        dto.storageKey,
        sortedParts,
        dto.tier
      );
    }

    // 2. Verify file exists in storage
    const exists = await this.storageService.fileExists(dto.storageKey, dto.tier);
    if (!exists) {
      throw new Error('File not found in storage. Upload may have failed.');
    }

    // 2. Get actual file size from storage if not provided correctly
    const actualSize = await this.storageService.getFileSize(dto.storageKey, dto.tier);
    const size = BigInt(actualSize);

    // 3. Generate Thumbnail if image
    let thumbnailKey: string | undefined = undefined;
    if (dto.mimeType.startsWith('image/')) {
      try {
        const { file } = await this.storageService.downloadFile(dto.storageKey, dto.tier);
        const thumbnailBuffer = await this.storageService.generateThumbnail(file);
        if (thumbnailBuffer) {
          const fileUuid = dto.storageKey.split('/').pop()?.split('-')[0];
          thumbnailKey = `${userId}/thumbnails/${fileUuid}.webp`;

          await this.storageService.uploadFile({
            objectName: thumbnailKey,
            file: thumbnailBuffer,
            contentType: 'image/webp',
            tier: StorageTier.STANDARD,
          });
        }
      } catch (error) {
        console.warn('Failed to generate thumbnail during complete upload:', error);
      }
    }

    // 4. Create DB Record
    const file = await this.fileRepository.create({
      userId,
      folderId: dto.folderId || null,
      name: dto.fileName,
      storageKey: dto.storageKey,
      storageTier: dto.tier || StorageTier.STANDARD,
      size,
      mimeType: dto.mimeType,
      extension: dto.fileName.split('.').pop(),
      thumbnailKey,
      isOfflineAvailable: false,
    });

    // 5. Update user storage usage
    await this.userRepository.incrementStorageUsed(userId, size);

    return file;
  }
}
