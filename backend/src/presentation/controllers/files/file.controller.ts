import { Response } from 'express';
import {
  UploadFileUseCase,
  GenerateFileLinkUseCase,
  DeleteFileUseCase,
  RestoreFileUseCase,
  GetStorageAnalyticsUseCase,
  InitiateUploadUseCase,
  CompleteUploadUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { StorageTier } from '../../../../generated/prisma/index.js';

export class FileController {
  constructor(
    private uploadFileUseCase: UploadFileUseCase,
    private generateFileLinkUseCase: GenerateFileLinkUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase,
    private getStorageAnalyticsUseCase: GetStorageAnalyticsUseCase,
    private initiateUploadUseCase: InitiateUploadUseCase,
    private completeUploadUseCase: CompleteUploadUseCase
  ) {}

  async initiateUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { fileName, mimeType, size, folderId, tier, path } = req.body;

      if (!fileName || !mimeType || size === undefined) {
        ResponseUtil.validationError(res, 'fileName, mimeType, and size are required');
        return;
      }

      const result = await this.initiateUploadUseCase.execute(req.user.id, {
        fileName,
        mimeType,
        size: BigInt(size),
        folderId,
        tier,
        path,
      });

      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate upload';
      ResponseUtil.error(res, 'INITIATE_UPLOAD_ERROR', message);
    }
  }

  async completeUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { storageKey, fileName, mimeType, size, folderId, tier, ociUploadId, parts } = req.body;

      if (!storageKey || !fileName || !mimeType || size === undefined) {
        ResponseUtil.validationError(res, 'Missing required fields for complete upload');
        return;
      }

      const result = await this.completeUploadUseCase.execute(req.user.id, {
        storageKey,
        fileName,
        mimeType,
        size: BigInt(size),
        folderId,
        tier,
        ociUploadId,
        parts,
      });

      // Convert BigInt for JSON
      const response = {
        ...result,
        size: result.size.toString(),
      };

      ResponseUtil.success(res, response, 'Upload completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete upload';
      ResponseUtil.error(res, 'COMPLETE_UPLOAD_ERROR', message);
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

  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      if (!req.file) {
        ResponseUtil.validationError(res, 'No file provided');
        return;
      }

      const { folderId, tier } = req.body;

      // Map string tier to Enum
      let storageTier: StorageTier = StorageTier.STANDARD;
      if (tier === 'ARCHIVE') {
        storageTier = StorageTier.ARCHIVE;
      }

      const result = await this.uploadFileUseCase.execute(req.user.id, {
        file: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: BigInt(req.file.size),
        folderId: folderId || null,
        tier: storageTier,
      });

      // Convert BigInt to string for JSON response
      const response = {
        ...result,
        size: result.size.toString(),
      };

      ResponseUtil.created(res, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      ResponseUtil.error(res, 'UPLOAD_FILE_ERROR', message);
    }
  }

  async generateLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'File ID is required and must be a string');
        return;
      }

      const result = await this.generateFileLinkUseCase.execute(req.user.id, id);

      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate link';
      ResponseUtil.error(res, 'GENERATE_LINK_ERROR', message);
    }
  }

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

      await this.restoreFileUseCase.execute(id, req.user.id);

      ResponseUtil.success(res, { success: true, message: 'File restored' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore file';
      ResponseUtil.error(res, 'RESTORE_FILE_ERROR', message);
    }
  }
}
