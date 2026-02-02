import { Response } from 'express';
import {
  GenerateFileLinkUseCase,
  DeleteFileUseCase,
  RestoreFileUseCase,
  GetStorageAnalyticsUseCase,
  InitiateUploadUseCase,
  CompleteUploadUseCase,
  GetFileThumbnailUseCase,
  GetMediaAlbumsUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { IFileRepository } from '../../../application/interfaces/index.js';

export class FileController {
  constructor(
    private fileRepository: IFileRepository,
    private generateFileLinkUseCase: GenerateFileLinkUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase,
    private getStorageAnalyticsUseCase: GetStorageAnalyticsUseCase,
    private initiateUploadUseCase: InitiateUploadUseCase,
    private completeUploadUseCase: CompleteUploadUseCase,
    private getFileThumbnailUseCase: GetFileThumbnailUseCase,
    private getMediaAlbumsUseCase: GetMediaAlbumsUseCase
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
      // Debug logs to diagnose missing fields
      console.log('Upload Request Headers:', req.headers);
      console.log('Upload Request Body:', JSON.stringify(req.body, null, 2));

      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 1. Normalize input into an array (Industry Grade: Batch Support)
      const inputs = Array.isArray(req.body) ? req.body : [req.body];

      if (inputs.length > 10) {
        ResponseUtil.validationError(res, 'Maximum 10 files per batch upload');
        return;
      }

      // 2. Global Batch Validation (5GB Limit)
      const MAX_BATCH_SIZE = 5 * 1024 * 1024 * 1024;
      const totalSize = inputs.reduce((sum, item) => sum + (Number(item.size) || 0), 0);

      if (totalSize > MAX_BATCH_SIZE) {
        ResponseUtil.validationError(
          res,
          `Total batch size (${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds 5GB limit`
        );
        return;
      }

      const results = await Promise.all(
        inputs.map(async (input: any, index: number) => {
          const storageKey = input.storageKey;
          const ociUploadId = input.ociUploadId;
          const parts = input.parts;
          // Flexible field resolution to support various client payloads
          const fileName = input.fileName || input.filename || input.name || input.originalName;
          const mimeType = input.mimeType || input.mimetype || input.type || input.contentType;
          const size = input.size !== undefined ? input.size : input.fileSize;

          const folderId = input.folderId;
          const tier = input.tier;
          const path = input.path;

          // MODE A: COMPLETION
          if (storageKey || ociUploadId) {
            if (!fileName || !mimeType || size === undefined) {
              return { error: 'Missing metadata for completion', fileName };
            }

            const result = await this.completeUploadUseCase.execute(req.user!.id, {
              storageKey,
              fileName,
              mimeType,
              size: BigInt(size),
              folderId,
              tier,
              ociUploadId,
              parts: typeof parts === 'string' ? JSON.parse(parts) : parts,
            });

            return { ...result, size: result.size.toString(), mode: 'COMPLETED' };
          }

          // MODE B: INITIATION
          let finalFileName: string = fileName || '';
          let finalMimeType: string = mimeType || '';
          let finalSize: number | string | bigint = size;

          // Postman metadata helper: Extract from 'files' array if present
          const expressFiles = req.files as any[] | undefined;
          const currentFile = expressFiles?.[index];
          if (currentFile) {
            finalFileName = finalFileName || currentFile.originalname;
            finalMimeType = finalMimeType || currentFile.mimetype;
            finalSize = finalSize !== undefined ? finalSize : currentFile.size;
          }

          if (!finalFileName || !finalMimeType || finalSize === undefined) {
            const missing = [];
            if (!finalFileName) missing.push('fileName');
            if (!finalMimeType) missing.push('mimeType');
            if (finalSize === undefined) missing.push('size');
            return {
              error: `VALIDATION_ERROR: Missing required fields for initiation: ${missing.join(', ')}`,
              received: {
                fileName: finalFileName,
                mimeType: finalMimeType,
                size: finalSize,
                originalInput: input,
              }, // Helpful debug info
              index,
            };
          }

          const result = await this.initiateUploadUseCase.execute(req.user!.id, {
            fileName: finalFileName,
            mimeType: finalMimeType,
            size: BigInt(finalSize),
            folderId: folderId || null,
            tier,
            path,
          });

          return { ...result, mode: 'INITIATED' };
        })
      );

      // Check for partial failures
      const hasErrors = results.some((r: any) => r.error);
      if (hasErrors && inputs.length === 1) {
        const validError = results[0] as any;
        ResponseUtil.validationError(res, validError.error || 'Upload error', validError.received);
        return;
      }

      ResponseUtil.success(res, results, 'Batch processed successfully');
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
}
