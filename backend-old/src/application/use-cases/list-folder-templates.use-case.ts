/**
 * List Folder Templates Use Case
 * 
 * List all folder templates for a user.
 */

import { prisma } from '../../infrastructure/database/index.js';

export interface FolderTemplateResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  structure: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListFolderTemplatesResult {
  templates: FolderTemplateResponse[];
  total: number;
}

export class ListFolderTemplatesUseCase {
  async execute(userId: string): Promise<ListFolderTemplatesResult> {
    const templates = await prisma.folderTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      templates: templates.map(t => ({
        id: t.id,
        userId: t.userId,
        name: t.name,
        description: t.description ?? undefined,
        structure: t.structure as Record<string, unknown>,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      total: templates.length,
    };
  }
}
