import { Response } from 'express';
import { UploadFileUseCase } from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { StorageTier } from '../../../../generated/prisma/index.js';

export class FileController {
  constructor(private uploadFileUseCase: UploadFileUseCase) {}

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
}
