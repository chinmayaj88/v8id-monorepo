import { Response } from 'express';
import {
  UploadFileUseCase,
  GenerateFileLinkUseCase,
  DeleteFileUseCase,
  RestoreFileUseCase,
  GetStorageAnalyticsUseCase,
  InitiateUploadUseCase,
  CompleteUploadUseCase,
  GetFileThumbnailUseCase,
  GetMediaAlbumsUseCase,
  MoveItemsUseCase,
  CopyItemsUseCase,
  BulkDeleteUseCase,
  CreateNoteUseCase,
} from '../../../application/use-cases/index.js';
import { FileMapper } from '../../../application/utils/file.mapper.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { IFileRepository } from '../../../application/interfaces/index.js';

export class FileController {
  constructor(
    private fileRepository: IFileRepository,
    private uploadFileUseCase: UploadFileUseCase,
    private generateFileLinkUseCase: GenerateFileLinkUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase,
    private getStorageAnalyticsUseCase: GetStorageAnalyticsUseCase,
    private initiateUploadUseCase: InitiateUploadUseCase,
    private completeUploadUseCase: CompleteUploadUseCase,
    private getFileThumbnailUseCase: GetFileThumbnailUseCase,
    private getMediaAlbumsUseCase: GetMediaAlbumsUseCase,
    private moveItemsUseCase: MoveItemsUseCase,
    private copyItemsUseCase: CopyItemsUseCase,
    private bulkDeleteUseCase: BulkDeleteUseCase,
    private createNoteUseCase: CreateNoteUseCase
  ) {}

  // Methods...
  async getAlbums(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const type = req.query.type as string;
      if (!['image', 'video', 'document'].includes(type)) {
        ResponseUtil.validationError(res, 'Valid type (image, video, document) required');
        return;
      }

      const albums = await this.getMediaAlbumsUseCase.execute(
        req.user.id,
        type as 'image' | 'video' | 'document'
      );

      ResponseUtil.success(res, albums);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get albums';
      ResponseUtil.error(res, 'ALBUMS_ERROR', message);
    }
  }

  async handleUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const expressFiles = req.files as any[] | undefined;
      let metadata: any[] = [];

      // 1. Parse Metadata
      if (req.body.metadata) {
        try {
          metadata =
            typeof req.body.metadata === 'string'
              ? JSON.parse(req.body.metadata)
              : req.body.metadata;
        } catch (e) {
          metadata = [];
        }
      } else {
        const bodyInputs = Array.isArray(req.body) ? req.body : [req.body];
        metadata = bodyInputs;
      }

      // If we have files but metadata is shorter, fill it
      if (expressFiles && expressFiles.length > metadata.length) {
        const lastMeta = metadata[metadata.length - 1] || {};
        for (let i = metadata.length; i < expressFiles.length; i++) {
          metadata.push({ ...lastMeta });
        }
      }

      // 2. Global Batch Validation (5GB Limit)
      const MAX_BATCH_SIZE = 5 * 1024 * 1024 * 1024;
      const totalSize = metadata.reduce((sum, item) => sum + (Number(item.size) || 0), 0);

      if (totalSize > MAX_BATCH_SIZE) {
        ResponseUtil.validationError(
          res,
          `Total batch size (${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds 5GB limit`
        );
        return;
      }

      // 3. Process Batch Sequentially (Avoid Race Conditions in Folder Creation)
      const results = [];
      for (let i = 0; i < metadata.length; i++) {
        const meta = metadata[i];
        const currentFile = expressFiles?.[i];

        try {
          // MODE 1: Direct Upload (File content present in request)
          if (currentFile) {
            const fileName = meta.fileName || meta.name || currentFile.originalname;
            const folderId = meta.folderId;
            const path = meta.path;

            const file = await this.uploadFileUseCase.execute(req.user!.id, {
              fileName,
              mimeType: currentFile.mimetype,
              size: BigInt(currentFile.size),
              file: currentFile.buffer,
              folderId,
              path,
            });

            results.push({ ...FileMapper.toDTO(file), mode: 'DIRECT' });
            continue;
          }

          // MODE 2: Multipart Completion
          const { storageKey, ociUploadId, parts } = meta;
          const fileName = meta.fileName || meta.name;
          const mimeType = meta.mimeType || meta.type;
          const size = meta.size;

          if (storageKey || ociUploadId) {
            if (!fileName || !mimeType || size === undefined) {
              results.push({ error: 'Missing metadata for completion', fileName, index: i });
              continue;
            }

            const result = await this.completeUploadUseCase.execute(req.user!.id, {
              storageKey,
              fileName,
              mimeType,
              size: BigInt(size),
              folderId: meta.folderId,
              tier: meta.tier,
              ociUploadId,
              parts: typeof parts === 'string' ? JSON.parse(parts) : parts,
            });

            results.push({ ...FileMapper.toDTO(result), mode: 'COMPLETED' });
            continue;
          }

          // MODE 3: Initiation (For large files, client will upload directly to storage)
          if (!fileName || !mimeType || size === undefined) {
            results.push({ error: 'Missing metadata for initiation', index: i });
            continue;
          }

          const result = await this.initiateUploadUseCase.execute(req.user!.id, {
            fileName,
            mimeType: mimeType,
            size: BigInt(size),
            folderId: meta.folderId || null,
            tier: meta.tier,
            path: meta.path,
          });

          results.push({ ...result, mode: 'INITIATED' });
        } catch (err: any) {
          results.push({
            error: err.message || 'Processing failed',
            index: i,
            fileName: currentFile?.originalname || meta.fileName,
          });
        }
      }

      // Check for partial failures
      const hasErrors = results.some((r: any) => r.error);
      const allFailed = results.every((r: any) => r.error);

      if (allFailed && metadata.length > 0) {
        ResponseUtil.error(res, 'UPLOAD_ERROR', 'All files in batch failed to upload', 400, {
          results,
        });
        return;
      }

      ResponseUtil.success(
        res,
        results,
        'Batch processed successfully' + (hasErrors ? ' with some errors' : '')
      );
    } catch (error) {
      console.error('Upload Handle Error:', error);
      const message = error instanceof Error ? error.message : 'Upload workflow failed';
      ResponseUtil.error(res, 'UPLOAD_ERROR', message);
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const analytics = await this.getStorageAnalyticsUseCase.execute(req.user.id);
      ResponseUtil.success(res, analytics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get storage analytics';
      ResponseUtil.error(res, 'GET_ANALYTICS_ERROR', message);
    }
  }

  async handleDownload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 1. Normalize input (Batch Support)
      const { ids, id } = req.body;
      const fileIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

      if (fileIds.length === 0) {
        ResponseUtil.validationError(res, 'No file IDs provided');
        return;
      }

      if (fileIds.length > 20) {
        ResponseUtil.validationError(res, 'Maximum 20 files per download batch');
        return;
      }

      // 2. Volume Limit Check (Enterprise Grade: 5GB max per individual batch request)
      const files = await Promise.all(fileIds.map(id => this.fileRepository.findById(id)));
      const validFiles = files.filter(f => f && f.userId === req.user!.id);

      const totalDownloadSize = validFiles.reduce((sum, f) => sum + (f ? Number(f.size) : 0), 0);
      const MAX_DOWNLOAD_BATCH_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

      if (totalDownloadSize > MAX_DOWNLOAD_BATCH_SIZE) {
        ResponseUtil.validationError(
          res,
          `Requested download size (${(totalDownloadSize / 1024 / 1024 / 1024).toFixed(
            2
          )} GB) exceeds 5GB batch limit`
        );
        return;
      }

      // 3. Process all links
      const results = await Promise.all(
        fileIds.map(async fileId => {
          try {
            const result = await this.generateFileLinkUseCase.execute(req.user!.id, fileId);
            return { ...result, success: true };
          } catch (error) {
            return {
              id: fileId,
              success: false,
              error: error instanceof Error ? error.message : 'Failed to generate link',
            };
          }
        })
      );

      ResponseUtil.success(res, results, 'Download links generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download workflow failed';
      ResponseUtil.error(res, 'DOWNLOAD_ERROR', message);
    }
  }

  // Remove old simple generateLink method as it's consolidated into handleDownload
  async OLD_generateLink_DELETED() {}

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'File ID must be a string');
        return;
      }
      const { permanent } = req.query;
      const isPermanent = String(permanent).toLowerCase() === 'true';

      await this.deleteFileUseCase.execute(id, req.user.id, isPermanent);

      ResponseUtil.success(res, {
        success: true,
        message: isPermanent ? 'File permanently deleted' : 'File moved to trash',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      ResponseUtil.error(res, 'DELETE_FILE_ERROR', message);
    }
  }

  async restore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'File ID is required');
        return;
      }

      await this.restoreFileUseCase.execute(id, req.user!.id);

      ResponseUtil.success(res, { success: true, message: 'File restored' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore file';
      ResponseUtil.error(res, 'RESTORE_FILE_ERROR', message);
    }
  }

  async getThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      // @ts-expect-error - The use case returns object with file/contentType
      const result = await this.getFileThumbnailUseCase.execute(req.user.id, id);

      res.setHeader('Content-Type', result.contentType || 'image/jpeg');
      if (result.contentLength) {
        res.setHeader('Content-Length', result.contentLength);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(result.file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get thumbnail';
      if (message.includes('not found') || message.includes('No thumbnail')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('Unauthorized') || message.includes('Access denied')) {
        ResponseUtil.forbidden(res, message);
      } else {
        ResponseUtil.error(res, 'THUMBNAIL_ERROR', message);
      }
    }
  }

  async moveItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { fileIds, folderIds, targetFolderId } = req.body;
      await this.moveItemsUseCase.execute(req.user.id, {
        fileIds: fileIds || [],
        folderIds: folderIds || [],
        targetFolderId,
      });

      ResponseUtil.success(res, { success: true, message: 'Items moved successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move items';
      ResponseUtil.error(res, 'MOVE_ERROR', message);
    }
  }

  async copyItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { fileIds, folderIds, targetFolderId } = req.body;
      await this.copyItemsUseCase.execute(req.user.id, {
        fileIds: fileIds || [],
        folderIds: folderIds || [],
        targetFolderId,
      });

      ResponseUtil.success(res, { success: true, message: 'Items copied successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy items';
      ResponseUtil.error(res, 'COPY_ERROR', message);
    }
  }

  async bulkDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { fileIds, folderIds, permanent } = req.body;
      const isPermanent = permanent === true || String(permanent).toLowerCase() === 'true';

      await this.bulkDeleteUseCase.execute(req.user.id, {
        fileIds: fileIds || [],
        folderIds: folderIds || [],
        permanent: isPermanent,
      });

      ResponseUtil.success(res, {
        success: true,
        message: isPermanent ? 'Items permanently deleted' : 'Items moved to trash',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete items';
      ResponseUtil.error(res, 'BULK_DELETE_ERROR', message);
    }
  }

  async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { name, content, folderId } = req.body;
      if (!name || !content) {
        ResponseUtil.validationError(res, 'Name and content are required');
        return;
      }

      const file = await this.createNoteUseCase.execute(req.user.id, {
        name,
        content,
        folderId,
      });

      ResponseUtil.success(res, file, 'Note created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create note';
      ResponseUtil.error(res, 'CREATE_NOTE_ERROR', message);
    }
  }
}
