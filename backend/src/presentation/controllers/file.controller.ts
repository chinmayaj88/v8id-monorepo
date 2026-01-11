/**
 * File Controller
 * 
 * Handles HTTP requests related to file operations.
 */

import { Response } from 'express';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case';
import { PermanentDeleteFileUseCase } from '../../application/use-cases/permanent-delete-file.use-case';
import { RestoreFileUseCase } from '../../application/use-cases/restore-file.use-case';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { PermanentDeleteFolderUseCase } from '../../application/use-cases/permanent-delete-folder.use-case';
import { RestoreFolderUseCase } from '../../application/use-cases/restore-folder.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { ArchiveFileUseCase } from '../../application/use-cases/archive-file.use-case';
import { GetFileUseCase } from '../../application/use-cases/get-file.use-case';
import { GetFolderUseCase } from '../../application/use-cases/get-folder.use-case';
import { ShareFileUseCase } from '../../application/use-cases/share-file.use-case';
import { ListSharedFilesUseCase } from '../../application/use-cases/list-shared-files.use-case';
import { UnshareFileUseCase } from '../../application/use-cases/unshare-file.use-case';
import { BulkDeleteFilesUseCase } from '../../application/use-cases/bulk-delete-files.use-case';
import { BulkMoveFilesUseCase } from '../../application/use-cases/bulk-move-files.use-case';
import { BulkRestoreFilesUseCase } from '../../application/use-cases/bulk-restore-files.use-case';
import { CopyFileUseCase } from '../../application/use-cases/copy-file.use-case';
import { CopyFolderUseCase } from '../../application/use-cases/copy-folder.use-case';
import { StorageAnalyticsUseCase } from '../../application/use-cases/storage-analytics.use-case';
import { PreviewFileUseCase } from '../../application/use-cases/preview-file.use-case';
import { ToggleFavoriteUseCase } from '../../application/use-cases/toggle-favorite.use-case';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.use-case';
import { CreateFileCommentUseCase } from '../../application/use-cases/create-file-comment.use-case';
import { ListFileCommentsUseCase } from '../../application/use-cases/list-file-comments.use-case';
import { SetFileExpirationUseCase } from '../../application/use-cases/set-file-expiration.use-case';
import { GenerateFileLinkUseCase } from '../../application/use-cases/generate-file-link.use-case';
import { ListFileVersionsUseCase } from '../../application/use-cases/list-file-versions.use-case';
import { RestoreFileVersionUseCase } from '../../application/use-cases/restore-file-version.use-case';
import { CreateFolderTemplateUseCase } from '../../application/use-cases/create-folder-template.use-case';
import { CreateFolderFromTemplateUseCase } from '../../application/use-cases/create-folder-from-template.use-case';
import { ListFolderTemplatesUseCase } from '../../application/use-cases/list-folder-templates.use-case';
import { GetFileActivityUseCase } from '../../application/use-cases/get-file-activity.use-case';
import { InitiateUploadUseCase } from '../../application/use-cases/initiate-upload.use-case';
import { ChunkUploadUseCase } from '../../application/use-cases/chunk-upload.use-case';
import { CompleteUploadUseCase } from '../../application/use-cases/complete-upload.use-case';
import { ResumeUploadUseCase } from '../../application/use-cases/resume-upload.use-case';
import { CreateFileVersionUseCase } from '../../application/use-cases/create-file-version.use-case';
import { UploadFileDTO, UpdateFileDTO, ListFilesDTO, CreateFolderDTO, UpdateFolderDTO, ListFoldersDTO } from '../../application/dtos/file.dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/response.util';

export class FileController {
  constructor(
    private uploadFileUseCase: UploadFileUseCase,
    private initiateUploadUseCase: InitiateUploadUseCase,
    private chunkUploadUseCase: ChunkUploadUseCase,
    private resumeUploadUseCase: ResumeUploadUseCase,
    private completeUploadUseCase: CompleteUploadUseCase,
    private downloadFileUseCase: DownloadFileUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private permanentDeleteFileUseCase: PermanentDeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase,
    private archiveFileUseCase: ArchiveFileUseCase,
    private getFileUseCase: GetFileUseCase,
    private getFolderUseCase: GetFolderUseCase,
    private shareFileUseCase: ShareFileUseCase,
    private listSharedFilesUseCase: ListSharedFilesUseCase,
    private unshareFileUseCase: UnshareFileUseCase,
    private bulkDeleteFilesUseCase: BulkDeleteFilesUseCase,
    private bulkMoveFilesUseCase: BulkMoveFilesUseCase,
    private bulkRestoreFilesUseCase: BulkRestoreFilesUseCase,
    private copyFileUseCase: CopyFileUseCase,
    private copyFolderUseCase: CopyFolderUseCase,
    private storageAnalyticsUseCase: StorageAnalyticsUseCase,
    private previewFileUseCase: PreviewFileUseCase,
    private toggleFavoriteUseCase: ToggleFavoriteUseCase,
    private listFavoritesUseCase: ListFavoritesUseCase,
    private createFileCommentUseCase: CreateFileCommentUseCase,
    private listFileCommentsUseCase: ListFileCommentsUseCase,
    private setFileExpirationUseCase: SetFileExpirationUseCase,
    private generateFileLinkUseCase: GenerateFileLinkUseCase,
    private listFileVersionsUseCase: ListFileVersionsUseCase,
    private restoreFileVersionUseCase: RestoreFileVersionUseCase,
    private createFolderTemplateUseCase: CreateFolderTemplateUseCase,
    private createFolderFromTemplateUseCase: CreateFolderFromTemplateUseCase,
    private listFolderTemplatesUseCase: ListFolderTemplatesUseCase,
    private getFileActivityUseCase: GetFileActivityUseCase,
    private listFilesUseCase: ListFilesUseCase,
    private updateFileUseCase: UpdateFileUseCase,
    private createFolderUseCase: CreateFolderUseCase,
    private updateFolderUseCase: UpdateFolderUseCase,
    private deleteFolderUseCase: DeleteFolderUseCase,
    private permanentDeleteFolderUseCase: PermanentDeleteFolderUseCase,
    private restoreFolderUseCase: RestoreFolderUseCase,
    private listFoldersUseCase: ListFoldersUseCase,
    private createFileVersionUseCase: CreateFileVersionUseCase
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
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

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
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.getFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GET_FILE_ERROR', message, 500);
      }
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
   * GET /api/files/trash
   * List deleted files (trash)
   */
  async listTrash(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ListFilesDTO = {
        status: 'DELETED' as any, // Only show deleted files
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
        'Trash files retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list trash files';
      ResponseUtil.error(res, 'LIST_TRASH_FILES_ERROR', message, 500);
    }
  }

  /**
   * PATCH /api/files/:id
   * Update file metadata
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }
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
   * Delete a file (soft delete - moves to trash)
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      await this.deleteFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, undefined, 'File moved to trash successfully');
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
   * DELETE /api/files/:id/permanent
   * Permanently delete a file from trash
   */
  async permanentDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      await this.permanentDeleteFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, undefined, 'File permanently deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to permanently delete file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('must be in trash')) {
        ResponseUtil.validationError(res, message);
      } else {
        ResponseUtil.error(res, 'PERMANENT_DELETE_FILE_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/restore
   * Restore a soft-deleted file
   */
  async restore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.restoreFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File restored successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('cannot be restored')) {
        ResponseUtil.validationError(res, message);
      } else {
        ResponseUtil.error(res, 'RESTORE_FILE_ERROR', message, 500);
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
   * GET /api/files/folders/trash
   * List deleted folders (trash)
   */
  async listTrashFolders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ListFoldersDTO = {
        includeDeleted: true, // Only show deleted folders
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await this.listFoldersUseCase.execute(userId, dto);

      // Filter to only show deleted folders
      const deletedFolders = result.folders.filter(folder => folder.isDeleted);

      ResponseUtil.successWithPagination(
        res,
        deletedFolders,
        {
          page: result.page,
          limit: result.limit,
          total: deletedFolders.length,
          totalPages: Math.ceil(deletedFolders.length / (result.limit || 20)),
        },
        'Trash folders retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list trash folders';
      ResponseUtil.error(res, 'LIST_TRASH_FOLDERS_ERROR', message, 500);
    }
  }

  /**
   * PATCH /api/files/folders/:id
   * Update folder metadata
   */
  async updateFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }
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
   * Delete a folder (soft delete - moves to trash)
   */
  async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }
      const forceDelete = req.query.forceDelete === 'true';

      await this.deleteFolderUseCase.execute(userId, folderId, forceDelete);

      ResponseUtil.success(res, undefined, 'Folder moved to trash successfully');
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

  /**
   * DELETE /api/files/folders/:id/permanent
   * Permanently delete a folder from trash
   */
  async permanentDeleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      await this.permanentDeleteFolderUseCase.execute(userId, folderId);

      ResponseUtil.success(res, undefined, 'Folder permanently deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to permanently delete folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('must be in trash')) {
        ResponseUtil.validationError(res, message);
      } else {
        ResponseUtil.error(res, 'PERMANENT_DELETE_FOLDER_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/folders/:id/restore
   * Restore a soft-deleted folder
   */
  async restoreFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      const result = await this.restoreFolderUseCase.execute(userId, folderId);

      ResponseUtil.success(res, result, 'Folder restored successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('cannot be restored')) {
        ResponseUtil.validationError(res, message);
      } else {
        ResponseUtil.error(res, 'RESTORE_FOLDER_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/upload/initiate
   * Initiate a chunked/resumable file upload
   */
  async initiateUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
        folderId: req.body.folderId || null,
        chunkSize: req.body.chunkSize,
      };

      const result = await this.initiateUploadUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, 'Upload session initiated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('quota') || message.includes('storage')) {
        ResponseUtil.error(res, 'STORAGE_QUOTA_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'INITIATE_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/upload/chunk
   * Upload a single chunk of a file
   */
  async uploadChunk(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const chunk = req.file;

      if (!chunk) {
        ResponseUtil.validationError(res, 'No chunk file provided');
        return;
      }

      const dto = {
        sessionId: req.body.sessionId,
        chunkNumber: parseInt(req.body.chunkNumber, 10),
        chunkData: chunk.buffer,
        isLastChunk: req.body.isLastChunk === true || req.body.isLastChunk === 'true',
      };

      const result = await this.chunkUploadUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, 'Chunk uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload chunk';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('Invalid chunk') || message.includes('expired')) {
        ResponseUtil.error(res, 'CHUNK_UPLOAD_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'CHUNK_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /**
   * GET /api/files/upload/:sessionId/resume
   * Resume an interrupted upload
   */
  async resumeUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      const result = await this.resumeUploadUseCase.execute(userId, sessionId);

      ResponseUtil.success(res, result, 'Upload session resumed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('expired') || message.includes('completed')) {
        ResponseUtil.error(res, 'RESUME_UPLOAD_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'RESUME_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/upload/:sessionId/complete
   * Complete an upload after all chunks are uploaded
   */
  async completeUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      const dto = {
        sessionId,
        name: req.body.name,
        description: req.body.description,
        tags: req.body.tags,
        metadata: req.body.metadata,
      };

      const result = await this.completeUploadUseCase.execute(userId, dto);

      ResponseUtil.created(res, result, 'File uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('incomplete') || message.includes('expired')) {
        ResponseUtil.error(res, 'COMPLETE_UPLOAD_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'COMPLETE_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/archive
   * Archive a file
   */
  async archive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.archiveFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File archived successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('cannot be archived')) {
        ResponseUtil.error(res, 'ARCHIVE_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'ARCHIVE_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/share
   * Share a file or folder with another user
   */
  async share(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;
      const dto = {
        fileId: fileId || null,
        folderId: req.body.folderId || null,
        sharedWithId: req.body.sharedWithId,
        permission: req.body.permission,
      };

      const result = await this.shareFileUseCase.execute(userId, dto);

      ResponseUtil.success(res, {
        id: result.id,
        fileId: result.fileId,
        folderId: result.folderId,
        ownerId: result.ownerId,
        sharedWithId: result.sharedWithId,
        permission: result.permission,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }, 'File/folder shared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share file/folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied') || message.includes('Cannot share')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'SHARE_ERROR', message, 400);
      }
    }
  }

  /**
   * GET /api/files/shared
   * List files and folders shared with the user
   */
  async listShared(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await this.listSharedFilesUseCase.execute(userId);

      ResponseUtil.success(res, result, 'Shared files and folders retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list shared files';
      ResponseUtil.error(res, 'LIST_SHARED_ERROR', message, 500);
    }
  }

  /**
   * DELETE /api/files/shares/:shareId
   * Unshare a file or folder
   */
  async unshare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shareId = req.params.shareId as string;

      if (!shareId) {
        ResponseUtil.validationError(res, 'Share ID is required');
        return;
      }

      await this.unshareFileUseCase.execute(userId, shareId);

      ResponseUtil.success(res, undefined, 'Share removed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unshare';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'UNSHARE_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/bulk/delete
   * Bulk delete multiple files
   */
  async bulkDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileIds: req.body.fileIds,
      };

      const result = await this.bulkDeleteFilesUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, `Bulk delete completed. ${result.deleted} deleted, ${result.failed} failed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk delete files';
      ResponseUtil.error(res, 'BULK_DELETE_ERROR', message, 400);
    }
  }

  /**
   * POST /api/files/bulk/move
   * Bulk move multiple files
   */
  async bulkMove(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileIds: req.body.fileIds,
        folderId: req.body.folderId === 'null' ? null : req.body.folderId,
      };

      const result = await this.bulkMoveFilesUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, `Bulk move completed. ${result.moved} moved, ${result.failed} failed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk move files';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'BULK_MOVE_ERROR', message, 400);
      }
    }
  }

  /**
   * POST /api/files/bulk/restore
   * Bulk restore multiple files from trash
   */
  async bulkRestore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileIds: req.body.fileIds,
      };

      const result = await this.bulkRestoreFilesUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, `Bulk restore completed. ${result.restored} restored, ${result.failed} failed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk restore files';
      ResponseUtil.error(res, 'BULK_RESTORE_ERROR', message, 400);
    }
  }

  /**
   * POST /api/files/:id/copy
   * Copy a file
   */
  async copyFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const dto = {
        targetFolderId: req.body.targetFolderId === 'null' ? null : req.body.targetFolderId,
        newName: req.body.newName,
      };

      const result = await this.copyFileUseCase.execute(userId, fileId, dto);

      ResponseUtil.created(res, result, 'File copied successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('quota') || message.includes('storage')) {
        ResponseUtil.error(res, 'STORAGE_QUOTA_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'COPY_FILE_ERROR', message, 500);
      }
    }
  }

  /**
   * GET /api/files/analytics
   * Get storage analytics
   */
  async getStorageAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await this.storageAnalyticsUseCase.execute(userId);

      ResponseUtil.success(res, result, 'Storage analytics retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get storage analytics';
      ResponseUtil.error(res, 'STORAGE_ANALYTICS_ERROR', message, 500);
    }
  }

  /**
   * GET /api/files/:id/preview
   * Preview a file
   */
  async preview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.previewFileUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File preview generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to preview file';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'PREVIEW_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/favorite
   * Toggle favorite status for a file or folder
   */
  async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;
      const dto = {
        fileId: fileId || null,
        folderId: req.body.folderId || null,
      };

      const result = await this.toggleFavoriteUseCase.execute(userId, dto);

      ResponseUtil.success(res, result, result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle favorite';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'TOGGLE_FAVORITE_ERROR', message, 400);
      }
    }
  }

  /**
   * GET /api/files/favorites
   * List favorite files and folders
   */
  async listFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await this.listFavoritesUseCase.execute(userId);

      ResponseUtil.success(res, result, 'Favorites retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list favorites';
      ResponseUtil.error(res, 'LIST_FAVORITES_ERROR', message, 500);
    }
  }

  /**
   * POST /api/files/:id/comments
   * Create a comment on a file or folder
   */
  async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;
      const dto = {
        fileId: fileId || null,
        folderId: req.body.folderId || null,
        content: req.body.content,
      };

      const result = await this.createFileCommentUseCase.execute(userId, dto);

      ResponseUtil.created(res, result, 'Comment created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'CREATE_COMMENT_ERROR', message, 400);
      }
    }
  }

  /**
   * GET /api/files/:id/comments
   * List comments on a file or folder
   */
  async listComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const fileId = req.params.id as string;
      const folderId = req.query.folderId as string | undefined;

      const result = await this.listFileCommentsUseCase.execute(fileId || null, folderId || null);

      ResponseUtil.success(res, result, 'Comments retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list comments';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'LIST_COMMENTS_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/expiration
   * Set file expiration date
   */
  async setExpiration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const dto = {
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      };

      await this.setFileExpirationUseCase.execute(userId, fileId, dto);

      ResponseUtil.success(res, undefined, 'File expiration set successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set file expiration';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('must be in the future')) {
        ResponseUtil.error(res, 'EXPIRATION_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'EXPIRATION_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/link
   * Generate a temporary download link
   */
  async generateLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;
      const dto = {
        fileId: fileId || null,
        folderId: req.body.folderId || null,
        expiresInHours: req.body.expiresInHours,
        maxDownloads: req.body.maxDownloads,
      };

      const result = await this.generateFileLinkUseCase.execute(userId, dto);

      ResponseUtil.created(res, result, 'Download link generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate link';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GENERATE_LINK_ERROR', message, 400);
      }
    }
  }

  /**
   * GET /api/files/:id/versions
   * List file versions
   */
  async listVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.listFileVersionsUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File versions retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list file versions';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'LIST_VERSIONS_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/:id/versions/:versionId/restore
   * Restore a file version
   */
  async restoreVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;
      const versionId = req.params.versionId as string;

      if (!fileId || !versionId) {
        ResponseUtil.validationError(res, 'File ID and Version ID are required');
        return;
      }

      const result = await this.restoreFileVersionUseCase.execute(userId, fileId, versionId);

      ResponseUtil.success(res, result, 'File version restored successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore file version';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'RESTORE_VERSION_ERROR', message, 500);
      }
    }
  }

  /**
   * GET /api/files/:id/activity
   * Get file activity log
   */
  async getActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id as string;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.getFileActivityUseCase.execute(userId, fileId);

      ResponseUtil.success(res, result, 'File activity retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get file activity';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GET_ACTIVITY_ERROR', message, 500);
      }
    }
  }

  /**
   * GET /api/files/folders/:id
   * Get folder metadata by ID
   */
  async getFolderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      const result = await this.getFolderUseCase.execute(userId, folderId);

      ResponseUtil.success(res, result, 'Folder retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GET_FOLDER_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/folders/:id/share
   * Share a folder with another user
   */
  async shareFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;
      const dto = {
        fileId: null,
        folderId: folderId || null,
        sharedWithId: req.body.sharedWithId,
        permission: req.body.permission,
      };

      const result = await this.shareFileUseCase.execute(userId, dto);

      ResponseUtil.success(res, {
        id: result.id,
        fileId: result.fileId,
        folderId: result.folderId,
        ownerId: result.ownerId,
        sharedWithId: result.sharedWithId,
        permission: result.permission,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }, 'Folder shared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied') || message.includes('Cannot share')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'SHARE_FOLDER_ERROR', message, 400);
      }
    }
  }

  /**
   * POST /api/files/folders/:id/copy
   * Copy a folder
   */
  async copyFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id as string;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      const dto = {
        targetParentId: req.body.targetParentId === 'null' ? null : req.body.targetParentId,
        newName: req.body.newName,
      };

      const result = await this.copyFolderUseCase.execute(userId, folderId, dto);

      ResponseUtil.created(res, result, 'Folder copied successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else if (message.includes('quota') || message.includes('storage')) {
        ResponseUtil.error(res, 'STORAGE_QUOTA_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'COPY_FOLDER_ERROR', message, 500);
      }
    }
  }

  /**
   * POST /api/files/folders/templates
   * Create a folder template
   */
  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        name: req.body.name,
        description: req.body.description,
        sourceFolderId: req.body.sourceFolderId,
      };

      const result = await this.createFolderTemplateUseCase.execute(userId, dto);

      ResponseUtil.created(res, result, 'Folder template created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder template';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'CREATE_TEMPLATE_ERROR', message, 400);
      }
    }
  }

  /**
   * GET /api/files/folders/templates
   * List folder templates
   */
  async listTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await this.listFolderTemplatesUseCase.execute(userId);

      ResponseUtil.success(res, result, 'Folder templates retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list folder templates';
      ResponseUtil.error(res, 'LIST_TEMPLATES_ERROR', message, 500);
    }
  }

  /**
   * POST /api/files/folders/templates/:templateId/create
   * Create folder from template
   */
  async createFromTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const templateId = req.params.templateId as string;

      if (!templateId) {
        ResponseUtil.validationError(res, 'Template ID is required');
        return;
      }

      const dto = {
        templateId,
        parentId: req.body.parentId === 'null' ? null : req.body.parentId,
        name: req.body.name,
      };

      const result = await this.createFolderFromTemplateUseCase.execute(userId, dto);

      ResponseUtil.created(res, { folderId: result }, 'Folder created from template successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder from template';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'CREATE_FROM_TEMPLATE_ERROR', message, 400);
      }
    }
  }
}
