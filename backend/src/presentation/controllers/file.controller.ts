/**
 * File Controller
 *
 * Handles HTTP requests related to file and folder operations.
 * Clean implementation with essential methods only.
 */

import { Response } from 'express';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case.js';
import { DownloadFileUseCase } from '../../application/use-cases/download-file.use-case.js';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case.js';
import { PermanentDeleteFileUseCase } from '../../application/use-cases/permanent-delete-file.use-case.js';
import { RestoreFileUseCase } from '../../application/use-cases/restore-file.use-case.js';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case.js';
import { UpdateFileUseCase } from '../../application/use-cases/update-file.use-case.js';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case.js';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case.js';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case.js';
import { PermanentDeleteFolderUseCase } from '../../application/use-cases/permanent-delete-folder.use-case.js';
import { RestoreFolderUseCase } from '../../application/use-cases/restore-folder.use-case.js';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case.js';
import { GetFileUseCase } from '../../application/use-cases/get-file.use-case.js';
import { GetFolderUseCase } from '../../application/use-cases/get-folder.use-case.js';
import { PreviewFileUseCase } from '../../application/use-cases/preview-file.use-case.js';
import { InitiateUploadUseCase } from '../../application/use-cases/initiate-upload.use-case.js';
import { ChunkUploadUseCase } from '../../application/use-cases/chunk-upload.use-case.js';
import { CompleteUploadUseCase } from '../../application/use-cases/complete-upload.use-case.js';
import { ResumeUploadUseCase } from '../../application/use-cases/resume-upload.use-case.js';
import { CancelUploadUseCase } from '../../application/use-cases/cancel-upload.use-case.js';
import { ShareByEmailUseCase } from '../../application/use-cases/share-by-email.use-case.js';
import { ListSharedFilesUseCase } from '../../application/use-cases/list-shared-files.use-case.js';
import { UnshareFileUseCase } from '../../application/use-cases/unshare-file.use-case.js';
import { SearchUsersUseCase } from '../../application/use-cases/search-users.use-case.js';
import { UnifiedSearchUseCase } from '../../application/use-cases/unified-search.use-case.js';
import { GetFolderPathUseCase } from '../../application/use-cases/get-folder-path.use-case.js';
import {
  UploadFileDTO,
  UpdateFileDTO,
  ListFilesDTO,
  CreateFolderDTO,
  UpdateFolderDTO,
  ListFoldersDTO,
} from '../../application/dtos/file.dto.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ResponseUtil } from '../utils/response.util.js';

export class FileController {
  constructor(
    private uploadFileUseCase: UploadFileUseCase,
    private initiateUploadUseCase: InitiateUploadUseCase,
    private chunkUploadUseCase: ChunkUploadUseCase,
    private resumeUploadUseCase: ResumeUploadUseCase,
    private completeUploadUseCase: CompleteUploadUseCase,
    private cancelUploadUseCase: CancelUploadUseCase,
    private downloadFileUseCase: DownloadFileUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private permanentDeleteFileUseCase: PermanentDeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase,
    private getFileUseCase: GetFileUseCase,
    private getFolderUseCase: GetFolderUseCase,
    private shareByEmailUseCase: ShareByEmailUseCase,
    private listSharedFilesUseCase: ListSharedFilesUseCase,
    private unshareFileUseCase: UnshareFileUseCase,
    private previewFileUseCase: PreviewFileUseCase,
    private listFilesUseCase: ListFilesUseCase,
    private updateFileUseCase: UpdateFileUseCase,
    private createFolderUseCase: CreateFolderUseCase,
    private updateFolderUseCase: UpdateFolderUseCase,
    private deleteFolderUseCase: DeleteFolderUseCase,
    private permanentDeleteFolderUseCase: PermanentDeleteFolderUseCase,
    private restoreFolderUseCase: RestoreFolderUseCase,
    private listFoldersUseCase: ListFoldersUseCase,
    private unifiedSearchUseCase: UnifiedSearchUseCase,
    private getFolderPathUseCase: GetFolderPathUseCase,
    private searchUsersUseCase: SearchUsersUseCase
  ) {}

  // ==========================================
  // FILE UPLOAD
  // ==========================================

  /** POST /api/files/upload - Single file upload */
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
        tags: req.body.tags
          ? Array.isArray(req.body.tags)
            ? req.body.tags
            : JSON.parse(req.body.tags)
          : undefined,
        metadata: req.body.metadata
          ? typeof req.body.metadata === 'string'
            ? JSON.parse(req.body.metadata)
            : req.body.metadata
          : undefined,
        storageTier: req.body.storageTier || undefined,
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

  /** POST /api/files/upload-multiple - Multiple files upload */
  async uploadMultiple(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        ResponseUtil.validationError(res, 'No files provided');
        return;
      }

      const results = [];
      for (const file of files) {
        const dto: UploadFileDTO = {
          folderId: req.body.folderId || null,
          storageTier: req.body.storageTier || undefined,
        };
        const result = await this.uploadFileUseCase.execute(
          userId,
          dto,
          file.buffer,
          file.originalname,
          file.mimetype
        );
        results.push(result);
      }

      ResponseUtil.created(
        res,
        { files: results, count: results.length },
        `${results.length} files uploaded successfully`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File upload failed';
      ResponseUtil.error(res, 'UPLOAD_ERROR', message, 500);
    }
  }

  // ==========================================
  // CHUNKED UPLOAD
  // ==========================================

  /** POST /api/files/upload/initiate - Start chunked upload */
  async initiateUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
        folderId: req.body.folderId || null,
        chunkSize: req.body.chunkSize,
        storageTier: req.body.storageTier || undefined,
      };

      const result = await this.initiateUploadUseCase.execute(userId, dto);
      ResponseUtil.success(res, result, 'Upload session initiated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate upload';
      if (message.includes('quota') || message.includes('storage')) {
        ResponseUtil.error(res, 'STORAGE_QUOTA_ERROR', message, 400);
      } else {
        ResponseUtil.error(res, 'INITIATE_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /** POST /api/files/upload/chunk/:sessionId - Upload a chunk */
  async uploadChunk(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;
      const chunk = req.file;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      if (!chunk) {
        ResponseUtil.validationError(res, 'No chunk file provided');
        return;
      }

      const dto = {
        sessionId,
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
      } else {
        ResponseUtil.error(res, 'CHUNK_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /** GET /api/files/upload/:sessionId/resume - Get upload progress */
  async resumeUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      const result = await this.resumeUploadUseCase.execute(userId, sessionId);
      ResponseUtil.success(res, result, 'Upload session retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, 'RESUME_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /** POST /api/files/upload/:sessionId/complete - Complete chunked upload */
  async completeUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      const result = await this.completeUploadUseCase.execute(userId, { sessionId });
      ResponseUtil.success(res, result, 'Upload completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, 'COMPLETE_UPLOAD_ERROR', message, 500);
      }
    }
  }

  /** DELETE /api/files/upload/:sessionId/cancel - Cancel chunked upload */
  async cancelUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.params.sessionId;

      if (!sessionId) {
        ResponseUtil.validationError(res, 'Session ID is required');
        return;
      }

      const result = await this.cancelUploadUseCase.execute(userId, sessionId);
      ResponseUtil.success(res, result, 'Upload cancelled successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel upload';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'CANCEL_UPLOAD_ERROR', message, 500);
      }
    }
  }

  // ==========================================
  // FILE/FOLDER LISTING
  // ==========================================

  /** GET /api/files - List files and folders */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderIdRaw = (req.query.parentId || req.query.folderId) as string | undefined;
      const dto: ListFilesDTO = {
        folderId:
          folderIdRaw === 'null' || folderIdRaw === '' || folderIdRaw === undefined
            ? null
            : folderIdRaw,
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
        result.items,
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

  /** GET /api/files/search - Universal search */
  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        search: (req.query.q || req.query.search) as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await this.unifiedSearchUseCase.execute(userId, dto);
      ResponseUtil.success(res, result, 'Search completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      ResponseUtil.error(res, 'SEARCH_ERROR', message, 500);
    }
  }

  /** GET /api/files/trash - List trash items */
  async listTrash(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ListFilesDTO = {
        status: 'DELETED' as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await this.listFilesUseCase.execute(userId, dto);

      ResponseUtil.successWithPagination(
        res,
        result.items,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        'Trash retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list trash';
      ResponseUtil.error(res, 'LIST_TRASH_ERROR', message, 500);
    }
  }

  // ==========================================
  // FILE OPERATIONS
  // ==========================================

  /** GET /api/files/:id - Get file details */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

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

  /** GET /api/files/:id/download - Download file */
  async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.downloadFileUseCase.execute(userId, fileId);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.contentLength.toString());
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

  /** GET /api/files/:id/preview - Preview file (inline viewing) */
  async preview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const result = await this.previewFileUseCase.execute(userId, fileId);
      ResponseUtil.success(res, result, 'Preview URL generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate preview';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'PREVIEW_ERROR', message, 500);
      }
    }
  }

  /** PATCH /api/files/:id - Update file */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

      if (!fileId) {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      const dto: UpdateFileDTO = {
        name: req.body.name,
        folderId:
          req.body.folderId !== undefined
            ? req.body.folderId === 'null'
              ? null
              : req.body.folderId
            : undefined,
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

  /** DELETE /api/files/:id - Soft delete file */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

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

  /** DELETE /api/files/:id/permanent - Permanent delete */
  async permanentDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

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
      } else {
        ResponseUtil.error(res, 'PERMANENT_DELETE_ERROR', message, 500);
      }
    }
  }

  /** POST /api/files/:id/restore - Restore from trash */
  async restore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const fileId = req.params.id;

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
      } else {
        ResponseUtil.error(res, 'RESTORE_ERROR', message, 500);
      }
    }
  }

  // ==========================================
  // FOLDER OPERATIONS
  // ==========================================

  /** POST /api/files/folders - Create folder */
  async createFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const parentIdRaw = req.body.parentId || req.body.parentFolderId;
      const dto: CreateFolderDTO = {
        parentId: parentIdRaw === 'null' ? null : parentIdRaw,
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

  /** GET /api/files/folders/:id/contents - Get folder contents */
  async getFolderContents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      // Get folder details
      const folder = await this.getFolderUseCase.execute(userId, folderId);

      // Get files in folder
      const filesDto: ListFilesDTO = { folderId };
      const files = await this.listFilesUseCase.execute(userId, filesDto);

      // Get subfolders
      const foldersDto: ListFoldersDTO = { parentId: folderId };
      const subfolders = await this.listFoldersUseCase.execute(userId, foldersDto);

      ResponseUtil.success(
        res,
        {
          folder,
          files: files.items,
          subfolders: subfolders.folders,
        },
        'Folder contents retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get folder contents';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GET_FOLDER_CONTENTS_ERROR', message, 500);
      }
    }
  }

  /** GET /api/files/folders/:id/path - Get breadcrumbs */
  async getFolderPath(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      const result = await this.getFolderPathUseCase.execute(userId, folderId);
      ResponseUtil.success(res, result, 'Folder path retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get folder path';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'GET_FOLDER_PATH_ERROR', message, 500);
      }
    }
  }

  /** PATCH /api/files/folders/:id - Update folder */
  async updateFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      const dto: UpdateFolderDTO = {
        name: req.body.name,
        parentId:
          req.body.parentId !== undefined
            ? req.body.parentId === 'null'
              ? null
              : req.body.parentId
            : undefined,
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

  /** DELETE /api/files/folders/:id - Soft delete folder */
  async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

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

  /** DELETE /api/files/folders/:id/permanent - Permanent delete folder */
  async permanentDeleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

      if (!folderId) {
        ResponseUtil.validationError(res, 'Folder ID is required');
        return;
      }

      await this.permanentDeleteFolderUseCase.execute(userId, folderId);
      ResponseUtil.success(res, undefined, 'Folder permanently deleted successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to permanently delete folder';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'PERMANENT_DELETE_FOLDER_ERROR', message, 500);
      }
    }
  }

  /** POST /api/files/folders/:id/restore - Restore folder from trash */
  async restoreFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const folderId = req.params.id;

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
      } else {
        ResponseUtil.error(res, 'RESTORE_FOLDER_ERROR', message, 500);
      }
    }
  }

  // ==========================================
  // SHARING
  // ==========================================

  /** GET /api/files/users/search - Search users for sharing */
  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        query: (req.query.q || req.query.email || req.query.search) as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      };

      const result = await this.searchUsersUseCase.execute(userId, dto);
      ResponseUtil.success(res, result, 'Users found successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User search failed';
      ResponseUtil.error(res, 'SEARCH_USERS_ERROR', message, 500);
    }
  }

  /** POST /api/files/share - Share by email */
  async shareByEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto = {
        fileId: req.body.fileId || null,
        folderId: req.body.folderId || null,
        email: req.body.email,
        permission: req.body.permission || 'VIEW',
      };

      const result = await this.shareByEmailUseCase.execute(userId, dto);
      ResponseUtil.success(res, result, 'Shared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied') || message.includes('yourself')) {
        ResponseUtil.validationError(res, message);
      } else {
        ResponseUtil.error(res, 'SHARE_ERROR', message, 500);
      }
    }
  }

  /** GET /api/files/shares - List my shares */
  async listShares(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await this.listSharedFilesUseCase.execute(userId);
      ResponseUtil.success(res, result, 'Shares retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list shares';
      ResponseUtil.error(res, 'LIST_SHARES_ERROR', message, 500);
    }
  }

  /** GET /api/files/shared-with-me - List files shared with me */
  async listSharedWithMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await this.listSharedFilesUseCase.execute(userId);
      ResponseUtil.success(res, result, 'Shared files retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list shared files';
      ResponseUtil.error(res, 'LIST_SHARED_ERROR', message, 500);
    }
  }

  /** DELETE /api/files/shares/:shareId - Remove share */
  async removeShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const shareId = req.params.shareId;

      if (!shareId) {
        ResponseUtil.validationError(res, 'Share ID is required');
        return;
      }

      await this.unshareFileUseCase.execute(userId, shareId);
      ResponseUtil.success(res, undefined, 'Share removed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove share';
      if (message.includes('not found')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'REMOVE_SHARE_ERROR', message, 500);
      }
    }
  }
}
