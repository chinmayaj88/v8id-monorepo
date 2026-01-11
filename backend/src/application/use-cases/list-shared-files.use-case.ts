/**
 * List Shared Files Use Case
 * 
 * List files and folders shared with the user.
 */

import { IFileShareRepository } from '../interfaces/file-share-repository.interface';
import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { FileResponseDTO, FolderResponseDTO } from '../dtos/file.dto';

export interface ListSharedFilesResult {
  files: FileResponseDTO[];
  folders: FolderResponseDTO[];
  total: number;
}

export class ListSharedFilesUseCase {
  constructor(
    private fileShareRepository: IFileShareRepository,
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string): Promise<ListSharedFilesResult> {
    // 1. Get all shares for user
    const shares = await this.fileShareRepository.findBySharedWith(userId);

    // 2. Separate file and folder shares
    const fileShares = shares.filter(s => s.isFileShare());
    const folderShares = shares.filter(s => s.isFolderShare());

    // 3. Fetch files
    const files: FileResponseDTO[] = [];
    for (const share of fileShares) {
      if (share.fileId) {
        const file = await this.fileRepository.findById(share.fileId);
        if (file && file.isActive()) {
          files.push({
            id: file.id,
            userId: file.userId,
            folderId: file.folderId,
            name: file.name,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: Number(file.size),
            type: file.type,
            status: file.status,
            description: file.description,
            tags: file.tags,
            metadata: file.metadata,
            createdAt: file.createdAt.toISOString(),
            updatedAt: file.updatedAt.toISOString(),
            deletedAt: file.deletedAt?.toISOString(),
          });
        }
      }
    }

    // 4. Fetch folders
    const folders: FolderResponseDTO[] = [];
    for (const share of folderShares) {
      if (share.folderId) {
        const folder = await this.folderRepository.findById(share.folderId);
        if (folder && !folder.isDeleted) {
          folders.push({
            id: folder.id,
            userId: folder.userId,
            parentId: folder.parentId,
            name: folder.name,
            description: folder.description,
            color: folder.color,
            isDeleted: folder.isDeleted,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
            deletedAt: folder.deletedAt?.toISOString(),
          });
        }
      }
    }

    return {
      files,
      folders,
      total: files.length + folders.length,
    };
  }
}
