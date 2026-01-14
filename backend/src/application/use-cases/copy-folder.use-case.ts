/**
 * Copy Folder Use Case
 * 
 * Copy a folder with all its contents (files and subfolders) recursively.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IFileRepository } from '../interfaces/file-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FolderResponseDTO } from '../dtos/file.dto';
import { CreateFolderUseCase } from './create-folder.use-case';
import { CopyFileUseCase } from './copy-file.use-case';

export interface CopyFolderDTO {
  targetParentId?: string | null;
  newName?: string;
}

export class CopyFolderUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository,
    private userRepository: IUserRepository,
    private createFolderUseCase: CreateFolderUseCase,
    private copyFileUseCase: CopyFileUseCase
  ) {}

  async execute(userId: string, folderId: string, dto: CopyFolderDTO): Promise<FolderResponseDTO> {
    const sourceFolder = await this.folderRepository.findById(folderId);
    if (!sourceFolder) {
      throw new Error('Folder not found');
    }

    if (sourceFolder.userId !== userId) {
      throw new Error('Access denied');
    }

    if (sourceFolder.isDeleted) {
      throw new Error('Cannot copy deleted folders');
    }

    const targetParentId = dto.targetParentId !== undefined ? dto.targetParentId : sourceFolder.parentId;
    if (targetParentId) {
      const parent = await this.folderRepository.findById(targetParentId);
      if (!parent || parent.userId !== userId || !parent.isActive()) {
        throw new Error('Target parent folder not found or access denied');
      }
    }

    let newName = dto.newName || sourceFolder.name;
    const nameExists = await this.folderRepository.nameExistsInParent(userId, targetParentId, newName);
    if (nameExists) {
      const timestamp = Date.now();
      newName = `${newName}-copy-${timestamp}`;
    }

    const newFolder = await this.createFolderUseCase.execute(userId, {
      parentId: targetParentId,
      name: newName,
      description: sourceFolder.description,
      color: sourceFolder.color,
    });

    await this.copyFolderContents(userId, sourceFolder.id, newFolder.id);

    return newFolder;
  }

  /**
   * Copy folder contents - OPTIMIZED with parallel processing
   */
  private async copyFolderContents(userId: string, sourceFolderId: string, targetFolderId: string): Promise<void> {
    // Fetch files and folders in parallel
    const [filesResult, foldersResult] = await Promise.all([
      this.fileRepository.findByFolderId(sourceFolderId, userId, {
        status: undefined,
      }),
      this.folderRepository.findChildren(sourceFolderId, userId, {
        includeDeleted: false,
      }),
    ]);

    // Copy files in parallel (with concurrency limit to avoid overwhelming)
    const activeFiles = filesResult.files.filter(f => f.isActive());
    const concurrencyLimit = 5;
    
    for (let i = 0; i < activeFiles.length; i += concurrencyLimit) {
      const batch = activeFiles.slice(i, i + concurrencyLimit);
      await Promise.all(
        batch.map(file =>
          this.copyFileUseCase.execute(userId, file.id, {
            targetFolderId,
          }).catch((error) => {
            // Failed to copy file - continue with other files
          })
        )
      );
    }

    // Copy subfolders sequentially (to maintain folder structure)
    // But process files within each folder in parallel
    for (const subfolder of foldersResult.folders) {
      if (!subfolder.isDeleted) {
        try {
          const copiedSubfolder = await this.createFolderUseCase.execute(userId, {
            parentId: targetFolderId,
            name: subfolder.name,
            description: subfolder.description,
            color: subfolder.color,
          });
          // Recursive call (folders must be sequential to maintain structure)
          await this.copyFolderContents(userId, subfolder.id, copiedSubfolder.id);
        } catch (error) {
          // Failed to copy subfolder - continue with other folders
        }
      }
    }
  }
}
