/**
 * File Controller
 * 
 * Handles HTTP requests related to file operations.
 */

import { Request, Response } from 'express';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { UploadFileDTO, UpdateFileDTO, ListFilesDTO, CreateFolderDTO, UpdateFolderDTO, ListFoldersDTO } from '../../application/dtos/file.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/response.util';

export class FileController {
  constructor(
    private uploadFileUseCase: UploadFileUseCase,
    private downloadFileUseCase: DownloadFileUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private listFilesUseCase: ListFilesUseCase,
    private updateFileUseCase: UpdateFileUseCase,
    private createFolderUseCase: CreateFolderUseCase,
    private updateFolderUseCase: UpdateFolderUseCase,
    private deleteFolderUseCase: DeleteFolderUseCase,
    private listFoldersUseCase: ListFoldersUseCase
  ) {}

  /**
   * POST /api/files/upload
   * Upload a new file
   */
  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        ResponseUtil.validationError(res, 'No file provided');
        return;
      }

      const dto: UploadFileDTO = {
        folderId: req.body.folderId || null,
        name: req.body.name,
        description: req.body.description,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : undefined,
        metadata: req.body.metadata ? (typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata) : undefined,
      };

      const result = await this.uploadFileUseCase.execute(
        userId,
        dto,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      ResponseUtil.created(res, result, 'File uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File upload failed';
      ResponseUtil.error(res, 'UPLOAD_ERROR', message, 500);
    }
  }

  /**
   * GET /api/files/:id/download
   * Download a file
   */
  async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

      const result = await this.downloadFileUseCase.execute(userId, fileId);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.contentLength.toString());

      if (result.metadata) {
        Object.entries(result.metadata).forEach(([key, value]) => {
          res.setHeader(`X-Meta-${key}`, value);
        });
      }

      res.send(result.file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File download failed';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'DOWNLOAD_ERROR', message, 500);
      }
    }
  }

  /**
   * GET /api/files/:id
   * Get file metadata
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // This would require a GetFileUseCase which we can add later
      // For now, we can use ListFilesUseCase or create a separate use case
      ResponseUtil.error(res, 'NOT_IMPLEMENTED', 'Get file by ID not yet implemented', 501);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get file';
      ResponseUtil.error(res, 'GET_FILE_ERROR', message, 500);
    }
  }

  /**
   * GET /api/files
   * List files with filtering and pagination
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ListFilesDTO = {
        folderId: req.query.folderId === 'null' ? null : (req.query.folderId as string | undefined),
        status: req.query.status as any,
        type: req.query.type as any,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        orderBy: req.query.orderBy as any,
        orderDirection: req.query.orderDirection as 'asc' | 'desc' | undefined,
      };

      const result = await this.listFilesUseCase.execute(userId, dto);

      ResponseUtil.successWithPagination(
        res,
        result.files,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        'Files retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list files';
      ResponseUtil.error(res, 'LIST_FILES_ERROR', message, 500);
    }
  }

  /**
   * PATCH /api/files/:id
   * Update file metadata
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;
      const dto: UpdateFileDTO = {
        name: req.body.name,
        folderId: req.body.folderId !== undefined ? (req.body.folderId === 'null' ? null : req.body.folderId) : undefined,
        description: req.body.description,
        tags: req.body.tags,
        metadata: req.body.metadata,
      };

      const result = await this.updateFileUseCase.execute(userId, fileId, dto);

      ResponseUtil.success(res, result, 'File updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'UPDATE_FILE_ERROR', message, 500);
      }
    }
  }

  /**
   * DELETE /api/files/:id
   * Delete a file (soft delete)
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;
      const hardDelete = req.query.hardDelete === 'true';

      await this.deleteFileUseCase.execute(userId, fileId, hardDelete);

      ResponseUtil.success(res, undefined, 'File deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'DELETE_FILE_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/folders
   * Create a new folder
   */
  async createFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: CreateFolderDTO = {
        parentId: req.body.parentId === 'null' ? null : req.body.parentId,
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
      };

      const result = await this.createFolderUseCase.execute(userId, dto);

      ResponseUtil.created(res, result, 'Folder created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder';
      ResponseUtil.error(res, 'CREATE_FOLDER_ERROR', message, 500);
    }
  }

  /**
   * GET /api/files/folders
   * List folders with filtering
   */
  async listFolders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ListFoldersDTO = {
        parentId: req.query.parentId === 'null' ? null : (req.query.parentId as string | undefined),
        includeDeleted: req.query.includeDeleted === 'true',
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await this.listFoldersUseCase.execute(userId, dto);

      ResponseUtil.successWithPagination(
        res,
        result.folders,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        'Folders retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list folders';
      ResponseUtil.error(res, 'LIST_FOLDERS_ERROR', message, 500);
    }
  }

  /**
   * PATCH /api/files/folders/:id
   * Update folder metadata
   */
  async updateFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;
      const dto: UpdateFolderDTO = {
        name: req.body.name,
        parentId: req.body.parentId !== undefined ? (req.body.parentId === 'null' ? null : req.body.parentId) : undefined,
        description: req.body.description,
        color: req.body.color,
      };

      const result = await this.updateFolderUseCase.execute(userId, folderId, dto);

      ResponseUtil.success(res, result, 'Folder updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'UPDATE_FOLDER_ERROR', message, 500);
      }
    }
  }

  /**
   * DELETE /api/files/folders/:id
   * Delete a folder (soft delete)
   */
  async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;
      const hardDelete = req.query.hardDelete === 'true';
      const forceDelete = req.query.forceDelete === 'true';

      await this.deleteFolderUseCase.execute(userId, folderId, hardDelete, forceDelete);

      ResponseUtil.success(res, undefined, 'Folder deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'DELETE_FOLDER_ERROR', message, 500);
      }
    }
  }
}
