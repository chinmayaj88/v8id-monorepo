/**
 * Create Folder Template Use Case
 * 
 * Create a folder template from an existing folder structure.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { prisma } from '../../infrastructure/database/index.js';

export interface CreateFolderTemplateDTO {
  name: string;
  description?: string;
  sourceFolderId: string;
}

export interface FolderTemplateResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  structure: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export class CreateFolderTemplateUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, dto: CreateFolderTemplateDTO): Promise<FolderTemplateResponse> {
    const sourceFolder = await this.folderRepository.findById(dto.sourceFolderId);
    if (!sourceFolder || sourceFolder.userId !== userId) {
      throw new Error('Source folder not found or access denied');
    }

    const structure = await this.buildFolderStructure(sourceFolder.id, userId);

    const template = await prisma.folderTemplate.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        structure: structure as any,
      },
    });

    return {
      id: template.id,
      userId: template.userId,
      name: template.name,
      description: template.description ?? undefined,
      structure: template.structure as Record<string, unknown>,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  private async buildFolderStructure(folderId: string, userId: string): Promise<Record<string, unknown>> {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    const structure: Record<string, unknown> = {
      name: folder.name,
      description: folder.description,
      color: folder.color,
      folders: [],
      fileCount: 0,
    };

    // Get subfolders
    const foldersResult = await this.folderRepository.findChildren(folderId, userId, {
      includeDeleted: false,
    });

    // Recursively build subfolder structures
    const subfolderStructures = await Promise.all(
      foldersResult.folders.map(subfolder => this.buildFolderStructure(subfolder.id, userId))
    );

    (structure.folders as Record<string, unknown>[]).push(...subfolderStructures);

    // Get file count
    const filesResult = await this.fileRepository.findByFolderId(folderId, userId, {
      status: undefined,
    });

    structure.fileCount = filesResult.total;

    return structure;
  }
}
