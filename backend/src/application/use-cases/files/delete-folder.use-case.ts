import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IStorageService } from '../../interfaces/files/storage-service.interface.js';

export class DeleteFolderUseCase {
  constructor(
    private readonly folderRepository: IFolderRepository,
    private readonly fileRepository: IFileRepository,
    private readonly storageService: IStorageService
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
      // Note: Repository findDescendants expects array of folderIds?
      // Let's check the interface. findDescendants(folderIds: string[], userId) in IFileRepository?
      // No, IFileRepository has findDescendants(folderIds: string[], userId). Correct.
      // Wait, current IFileRepository only finds *direct* children if we pass [folderId]?
      // No, we need *recursive* descendants.
      // IFolderRepository has findDescendants which returns folders.
      // IFileRepository needs a way to find files in a list of folders.

      // Better approach for Permanent Delete:
      // 1. Get all descendant FOLDERS (including self or just children).
      const subfolders = await this.folderRepository.findDescendants(folderId, userId);
      const allFolderIds = [folderId, ...subfolders.map(f => f.id)];

      // 2. Get all files in these folders
      // We can use findDescendants on FileRepository if it accepts folder list.
      const filesToDelete = await this.fileRepository.findDescendants(allFolderIds, userId);

      // 3. Delete from Storage
      // Parallelize for performance, but careful with rate limits.
      const deletePromises = filesToDelete.map(async file => {
        try {
          await this.storageService.deleteFile(file.storageKey, file.storageTier);
          if (file.thumbnailKey) {
            await this.storageService.deleteFile(file.thumbnailKey);
          }
        } catch (err) {
          console.error(`Failed to delete storage object for file ${file.id}`, err);
          // Swallow error to proceed with DB delete?
          // "Best effort" cleanup.
        }
      });
      await Promise.all(deletePromises);

      // 4. Delete Files from DB (Bulk delete?)
      // Repositories usually have single delete. Bulk delete is better.
      // If not available, loop.
      for (const file of filesToDelete) {
        await this.fileRepository.delete(file.id);
      }

      // 5. Delete Folders from DB
      // Must delete children first? Or Cascade?
      // Prisma handles Cascade delete if schema allows.
      // Schema: Folder -> children Folder[] @relation("FolderHierarchy") ... onDelete: Cascade?
      // Let's check Schema.
      // parent Folder? @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
      // YES! Prisma handles cascade.
      // So deleting the parent folder should cascade delete all children folders and files!
      // Files: folder Folder? @relation(fields: [folderId], references: [id], onDelete: Cascade)
      // YES!

      // So for DB, we only need to delete the target folder.
      // BUT for Storage, we MUST manually find and delete files BEFORE deleting the folder from DB
      // (because once DB record is gone, we lose the storageKey).

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
