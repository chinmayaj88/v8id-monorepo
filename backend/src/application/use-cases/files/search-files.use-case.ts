import { File, Folder } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';

export interface SearchFilesDTO {
  query: string;
  type?: 'all' | 'folder' | 'file';
  page?: number;
  limit?: number;
}

export interface SearchResults {
  folders: Folder[];
  files: File[];
  totalCount: number;
}

export class SearchFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: SearchFilesDTO): Promise<SearchResults> {
    const { query, type = 'all' } = dto;
    const search = query.trim();

    if (!search) {
      return { folders: [], files: [], totalCount: 0 };
    }

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

    const [folders, files] = await Promise.all(promises);

    return {
      folders,
      files,
      totalCount: folders.length + files.length,
    };
  }
}
