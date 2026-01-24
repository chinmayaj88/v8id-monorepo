/**
 * Get Folder Path Use Case
 *
 * Retrieves the full path (breadcrumb trail) for a folder.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { SearchResultItemDTO } from '../dtos/search.dto.js';

export class GetFolderPathUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute(userId: string, folderId: string): Promise<SearchResultItemDTO[]> {
    const folders = await this.folderRepository.getFolderPath(folderId);

    // Security check: ensure all folders in the path belong to the user
    if (folders.some(f => f.userId !== userId)) {
      throw new Error('Access denied');
    }

    return folders.map(folder => ({
      id: folder.id,
      type: 'folder',
      name: folder.name,
      description: folder.description,
      updatedAt: folder.updatedAt.toISOString(),
      color: folder.color,
      parentId: folder.parentId,
    }));
  }
}
