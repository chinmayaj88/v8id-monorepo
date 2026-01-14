/**
 * Create Folder From Template Use Case
 * 
 * Create a new folder structure from a template.
 */

import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { prisma } from '../../infrastructure/database';
import { CreateFolderUseCase } from './create-folder.use-case';

export interface CreateFolderFromTemplateDTO {
  templateId: string;
  parentId?: string | null;
  name?: string; // Override template name
}

export class CreateFolderFromTemplateUseCase {
  constructor(
    private folderRepository: IFolderRepository,
    private createFolderUseCase: CreateFolderUseCase
  ) {}

  async execute(userId: string, dto: CreateFolderFromTemplateDTO): Promise<string> {
    const template = await prisma.folderTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.userId !== userId) {
      throw new Error('Access denied');
    }

    const structure = template.structure as any;
    const folderName = dto.name || structure.name;

    const rootFolder = await this.createFolderUseCase.execute(userId, {
      parentId: dto.parentId,
      name: folderName,
      description: structure.description,
      color: structure.color,
    });

    if (structure.folders && Array.isArray(structure.folders)) {
      await this.createSubfolders(userId, rootFolder.id, structure.folders);
    }

    return rootFolder.id;
  }

  private async createSubfolders(userId: string, parentId: string, subfolders: any[]): Promise<void> {
    for (const subfolderStructure of subfolders) {
      try {
        const subfolder = await this.createFolderUseCase.execute(userId, {
          parentId,
          name: subfolderStructure.name,
          description: subfolderStructure.description,
          color: subfolderStructure.color,
        });

        // Recursively create nested subfolders
        if (subfolderStructure.folders && Array.isArray(subfolderStructure.folders)) {
          await this.createSubfolders(userId, subfolder.id, subfolderStructure.folders);
        }
      } catch (error) {
        // Failed to create subfolder - continue with other folders
      }
    }
  }
}
