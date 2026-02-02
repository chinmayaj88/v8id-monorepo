import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { File, Folder } from '../../../infrastructure/database/index.js';
import { IFolderRepository } from '../../interfaces/files/folder-repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { FileItemDTO, FolderItemDTO } from '../../dtos/files/file-item.dto.js';

export class ListTrashUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly folderRepository: IFolderRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(
    userId: string,
    _options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) throw new Error('User not found');
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    const foldersRaw = await this.folderRepository.findAllByUserId(userId, {
      isDeleted: true,
    });

    const filesRaw = await this.fileRepository.findAllByUserId(userId, {
      isDeleted: true,
    });

    // Map to DTOs
    const mapFolder = (f: Folder): FolderItemDTO => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isOwner: f.userId === userId,
      ownerName: currentUserName,
    });

    const mapFile = (f: File): FileItemDTO => ({
      id: f.id,
      name: f.name,
      size: f.size.toString(),
      mimeType: f.mimeType,
      extension: f.extension,
      thumbnailUrl: null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isOwner: f.userId === userId,
      ownerName: currentUserName,
    });

    return {
      folders: foldersRaw.map(mapFolder),
      files: filesRaw.map(mapFile),
    };
  }
}
