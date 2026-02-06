import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { IStorageService } from '../../interfaces/files/storage-service.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export interface CopyItemsRequest {
  fileIds: string[];
  folderIds: string[];
  targetFolderId: string | null;
}

export class CopyItemsUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly folderRepository: IFolderRepository,
    private readonly storageService: IStorageService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string, request: CopyItemsRequest): Promise<void> {
    const { fileIds, folderIds, targetFolderId } = request;

    let targetPath = '';
    if (targetFolderId) {
      const targetFolder = await this.folderRepository.findById(targetFolderId);
      if (!targetFolder) throw new Error('Target folder not found');
      targetPath = targetFolder.path;
    }

    // 1. Copy Files
    for (const fileId of fileIds) {
      await this.copyFile(fileId, targetFolderId, userId);
    }

    // 2. Copy Folders
    for (const folderId of folderIds) {
      await this.recursiveCopyFolder(folderId, targetFolderId, userId, targetPath);
    }
  }

  private async copyFile(
    fileId: string,
    targetFolderId: string | null,
    userId: string
  ): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file || file.userId !== userId) return;

    // Quota Check
    const user = await this.userRepository.findById(userId);
    if (!user) return;
    if (user.storageUsed + file.size > user.storageQuota) {
      throw new Error('Storage quota exceeded during copy');
    }

    // Storage Copy
    const fileUuid = crypto.randomUUID();
    const newStorageKey = `${userId}/${fileUuid}-${file.name}`;
    await this.storageService.copyFile(file.storageKey, newStorageKey, file.storageTier);

    // DB Entry
    await this.fileRepository.create({
      userId,
      folderId: targetFolderId,
      name: file.name,
      storageKey: newStorageKey,
      storageTier: file.storageTier,
      size: file.size,
      mimeType: file.mimeType,
      extension: file.extension || undefined,
      thumbnailKey: file.thumbnailKey || undefined,
    });

    // Update Quota
    await this.userRepository.incrementStorageUsed(userId, file.size);
  }

  private async recursiveCopyFolder(
    folderId: string,
    targetParentId: string | null,
    userId: string,
    targetParentPath: string
  ): Promise<void> {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder || folder.userId !== userId) return;

    // Create New Folder
    const newPath = targetParentPath === '' ? folder.name : `${targetParentPath}/${folder.name}`;
    const newFolder = await this.folderRepository.create({
      userId,
      parentId: targetParentId,
      name: folder.name,
      path: newPath,
    });

    // Copy Files in this folder
    const files = await this.fileRepository.findByFolderId(folderId, userId);
    for (const file of files) {
      await this.copyFile(file.id, newFolder.id, userId);
    }

    // Recursively copy subfolders
    const subfolders = await this.folderRepository.findByParentId(folderId, userId);
    for (const sub of subfolders) {
      await this.recursiveCopyFolder(sub.id, newFolder.id, userId, newPath);
    }
  }
}
