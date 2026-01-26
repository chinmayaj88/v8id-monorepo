/**
 * List File Comments Use Case
 * 
 * List all comments for a file or folder.
 */

import { prisma } from '../../infrastructure/database/index.js';

export interface FileCommentResponse {
  id: string;
  fileId: string | null;
  folderId: string | null;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ListFileCommentsResult {
  comments: FileCommentResponse[];
  total: number;
}

export class ListFileCommentsUseCase {
  async execute(fileId: string | null, folderId: string | null): Promise<ListFileCommentsResult> {
    // Validate that either fileId or folderId is provided
    if ((!fileId && !folderId) || (fileId && folderId)) {
      throw new Error('Either fileId or folderId must be provided, but not both');
    }

    const comments = await prisma.fileComment.findMany({
      where: {
        fileId: fileId || null,
        folderId: folderId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      comments: comments.map(comment => ({
        id: comment.id,
        fileId: comment.fileId ?? null,
        folderId: comment.folderId ?? null,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user ? {
          id: comment.user.id,
          email: comment.user.email,
          firstName: comment.user.firstName ?? undefined,
          lastName: comment.user.lastName ?? undefined,
        } : undefined,
      })),
      total: comments.length,
    };
  }
}
