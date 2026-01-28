import { File, Folder } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { FileItemDTO, FolderItemDTO } from '../../dtos/files/file-item.dto.js';

export interface SearchFilesDTO {
  query: string;
  type?: 'all' | 'folder' | 'file';
  page?: number;
  limit?: number;
}

export interface SearchResults {
  folders: FolderItemDTO[];
  files: FileItemDTO[];
  totalCount: number;
}

export class SearchFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string, dto: SearchFilesDTO): Promise<SearchResults> {
    const { query, type = 'all' } = dto;
    const search = query.trim();

    if (!search) {
      return { folders: [], files: [], totalCount: 0 };
    }

    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) throw new Error('User not found');
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    // Parallel execution for performance
    const promises: [Promise<Folder[]>, Promise<File[]>] = [
      Promise.resolve([]),
      Promise.resolve([]),
    ];

    if (type === 'all' || type === 'folder') {
      promises[0] = this.folderRepository.findAllByUserId(userId, { search });
    }

    if (type === 'all' || type === 'file') {
      promises[1] = this.fileRepository.findAllByUserId(userId, { search });
    }

    const [foldersRaw, filesRaw] = await Promise.all(promises);

    // Map to DTOs
    const mapFolder = (f: Folder): FolderItemDTO => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isOwner: f.userId === userId,
      ownerName: currentUserName, // Search currently only returns user's own files
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
      totalCount: foldersRaw.length + filesRaw.length,
    };
  }
}
