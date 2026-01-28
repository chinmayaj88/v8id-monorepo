import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IStorageService } from '../../interfaces/files/storage-service.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export class DeleteFolderUseCase {
  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly fileRepository: IFileRepository,
    private readonly storageService: IStorageService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(folderId: string, userId: string, permanent: boolean = false): Promise<void> {
    const folder = await this.folderRepository.findById(folderId);

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (permanent) {
      // Recursive Permanent Delete
      // 1. Get all descendant FOLDERS (including self or just children).
      const subfolders = await this.folderRepository.findDescendants(folderId, userId);
      const allFolderIds = [folderId, ...subfolders.map(f => f.id)];

      // 2. Get all files in these folders
      const filesToDelete = await this.fileRepository.findDescendants(allFolderIds, userId);

      // 3. Delete from Storage
      // Parallelize for performance, but careful with rate limits.
      const deletePromises = filesToDelete.map(async file => {
        await this.storageService.deleteFile(file.storageKey, file.storageTier);
        if (file.thumbnailKey) {
          await this.storageService.deleteFile(file.thumbnailKey);
        }
      });
      await Promise.all(deletePromises);

      // 4. Delete Files from DB (Bulk delete?)
      for (const file of filesToDelete) {
        await this.fileRepository.delete(file.id);
      }

      // Update Quota - sum up sizes
      const totalSize = filesToDelete.reduce((acc, file) => acc + file.size, BigInt(0));
      if (totalSize > BigInt(0)) {
        await this.userRepository.decrementStorageUsed(userId, totalSize);
      }

      // 5. Delete Folders from DB (Prisma Cascade handles children)
      await this.folderRepository.delete(folderId);
    } else {
      // Soft Delete
      // Does soft-delete cascade?
      // Prisma does NOT cascade updates usually.
      // We should soft-delete the folder.
      // If we simply set isDeleted=true on the folder, existing queries for files need to check parent's status.
      // Current findByFolderId checks `isDeleted: false` on file, but doesn't check parent.
      // Check `FileRepository.findByFolderId`:
      // where: { folderId: folderId, isDeleted: false }
      // It does NOT join parent to check if parent is deleted.
      // So if we only soft-delete parent, the files inside are still "visible" if accessed directly or via search?

      // UX Decision:
      // Option A: Recursive Soft Delete (Set isDeleted=true on all descendants).
      // Option B: Smart Querying (Filter out files with deleted parents).

      // Recursive Soft Delete is more robust for simple queries.

      const subfolders = await this.folderRepository.findDescendants(folderId, userId);
      const allFolderIds = [folderId, ...subfolders.map(f => f.id)];

      // Bulk update files?
      // We don't have bulk update in repo.
      // Ideally implementation of recursive soft delete should be in UseCase or Repository.
      // Repository "softDeleteRecursive" is cleaner.
      // But for now, loop is safer given we have the IDs.

      // Find files in all these folders
      const filesToSoftDelete = await this.fileRepository.findDescendants(allFolderIds, userId);

      for (const file of filesToSoftDelete) {
        await this.fileRepository.softDelete(file.id);
      }

      for (const f of subfolders) {
        await this.folderRepository.softDelete(f.id);
      }

      await this.folderRepository.softDelete(folderId);
    }
  }
}
