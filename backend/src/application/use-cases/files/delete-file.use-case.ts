import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IStorageService } from '../../interfaces/files/storage-service.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export class DeleteFileUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly storageService: IStorageService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(fileId: string, userId: string, permanent: boolean = false): Promise<void> {
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (permanent) {
      // Hard delete from storage first
      try {
        await this.storageService.deleteFile(file.storageKey, file.storageTier);
        if (file.thumbnailKey) {
          // Thumbnails usually in standard tier, or same bucket logic?
          // The interface doesn't explicitly handle thumbnail deletion, generally managed by bucket policy or implicit knowledge.
          // But if we have the key, we should try.
          // Assuming thumbnail in STANDARD tier for now as per schema comments
          await this.storageService.deleteFile(file.thumbnailKey);
        }
      } catch (error) {
        console.error(`Failed to delete file from storage: ${file.storageKey}`, error);
        throw error;
      }

      await this.fileRepository.delete(fileId);

      // Update Quota
      await this.userRepository.decrementStorageUsed(userId, file.size);
    } else {
      // Soft delete
      await this.fileRepository.softDelete(fileId);
    }
  }
}
