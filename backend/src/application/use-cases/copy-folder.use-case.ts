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

  private async copyFolderContents(userId: string, sourceFolderId: string, targetFolderId: string): Promise<void> {
    const filesResult = await this.fileRepository.findByFolderId(sourceFolderId, userId, {
      status: undefined,
    });

    for (const file of filesResult.files) {
      if (file.isActive()) {
        try {
          await this.copyFileUseCase.execute(userId, file.id, {
            targetFolderId,
          });
        } catch (error) {
          console.warn(`Failed to copy file ${file.id}:`, error);
        }
      }
    }

    const foldersResult = await this.folderRepository.findChildren(sourceFolderId, userId, {
      includeDeleted: false,
    });

    for (const subfolder of foldersResult.folders) {
      if (!subfolder.isDeleted) {
        try {
          const copiedSubfolder = await this.createFolderUseCase.execute(userId, {
            parentId: targetFolderId,
            name: subfolder.name,
            description: subfolder.description,
            color: subfolder.color,
          });
          await this.copyFolderContents(userId, subfolder.id, copiedSubfolder.id);
        } catch (error) {
          console.warn(`Failed to copy subfolder ${subfolder.id}:`, error);
        }
      }
    }
  }
}
