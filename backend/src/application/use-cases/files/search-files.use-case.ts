import { File, Folder } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { FileItemDTO, FolderItemDTO } from '../../dtos/files/file-item.dto.js';
import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';
import { VaultSecretListItem } from '../vault/list-vault-secrets.use-case.js';

export interface SearchFilesDTO {
  query: string;
  type?: 'all' | 'folder' | 'file' | 'secret';
  page?: number;
  limit?: number;
}

export interface SearchResults {
  folders: FolderItemDTO[];
  files: FileItemDTO[];
  secrets: VaultSecretListItem[];
  totalCount: number;
}

export class SearchFilesUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository,
    private vaultRepository: IVaultRepository
  ) {}

  async execute(userId: string, dto: SearchFilesDTO): Promise<SearchResults> {
    const { query, type = 'all' } = dto;
    const search = query.trim();

    if (!search) {
      return { folders: [], files: [], secrets: [], totalCount: 0 };
    }

    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) throw new Error('User not found');
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    // Parallel execution for performance
    const promises: [Promise<Folder[]>, Promise<File[]>, Promise<any[]>] = [
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([]),
    ];

    if (type === 'all' || type === 'folder') {
      promises[0] = this.folderRepository.findAllByUserId(userId, { search });
    }

    if (type === 'all' || type === 'file') {
      promises[1] = this.fileRepository.findAllByUserId(userId, { search });
    }

    if ((type === 'all' || type === 'secret') && this.vaultRepository) {
      promises[2] = this.vaultRepository.search(userId, search).catch(err => {
        console.warn('Vault search failed:', err);
        return [];
      });
    }

    const [foldersRaw, filesRaw, secretsRaw] = await Promise.all(promises);

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

    const mapSecret = (s: any): VaultSecretListItem => ({
      id: s.id,
      name: s.name,
      url: s.url,
      username: s.username,
      category: s.category,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });

    return {
      folders: foldersRaw.map(mapFolder),
      files: filesRaw.map(mapFile),
      secrets: secretsRaw.map(mapSecret),
      totalCount: foldersRaw.length + filesRaw.length + secretsRaw.length,
    };
  }
}
