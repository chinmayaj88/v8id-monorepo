import { Response } from 'express';
import {
  UploadFileUseCase,
  GenerateFileLinkUseCase,
  DeleteFileUseCase,
  RestoreFileUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { StorageTier } from '../../../../generated/prisma/index.js';

export class FileController {
  constructor(
    private uploadFileUseCase: UploadFileUseCase,
    private generateFileLinkUseCase: GenerateFileLinkUseCase,
    private deleteFileUseCase: DeleteFileUseCase,
    private restoreFileUseCase: RestoreFileUseCase
  ) {}

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

      const isPermanent = permanent === 'true';

      await this.deleteFileUseCase.execute(req.user.id, id, isPermanent); // UseCase signature: execute(userId, fileId, permanent) wait, UseCase says: execute(fileId, userId, permanent)

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
