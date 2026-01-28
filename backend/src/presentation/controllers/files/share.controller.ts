import { Request, Response } from 'express';
import {
  CreateFileShareUseCase,
  GetSharedFileUseCase,
  ListSharedWithMeUseCase,
  CreateShareInput,
} from '../../../application/use-cases/index.js';
import { ShareType, SharePermission } from '../../../../generated/prisma/index.js'; // Fix import
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { IStorageService } from '../../../application/interfaces/files/storage-service.interface.js';

export class ShareController {
  constructor(
    private createFileShareUseCase: CreateFileShareUseCase,
    private getSharedFileUseCase: GetSharedFileUseCase,
    private listSharedWithMeUseCase: ListSharedWithMeUseCase,
    private storageService: IStorageService
  ) {}

  /**
   * POST /api/files/:id/share
   * Share a file internally or create a public link
   */
  async createShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'Invalid file ID');
        return;
      }
      const { type, permission, email, expiresInSeconds } = req.body;

      if (!Object.values(ShareType).includes(type)) {
        ResponseUtil.validationError(res, 'Invalid share type');
        return;
      }

      if (!Object.values(SharePermission).includes(permission)) {
        ResponseUtil.validationError(res, 'Invalid permission');
        return;
      }

      const input: CreateShareInput = {
        fileId: id,
        ownerId: req.user.id,
        type: type,
        permission: permission,
        email,
        expiresInSeconds,
      };

      const result = await this.createFileShareUseCase.execute(input);

      // If public link, construct the full URL
      let responseData: any = result;
      if (result.type === ShareType.PUBLIC_LINK && result.token) {
        // Assuming frontend hosted at specific domain or same domain
        // For now just return the token and let frontend build the link
        // Or build a full link if env var available
        // const link = `${process.env.APP_URL}/share/${result.token}`;
        responseData = { ...result, link: `/share/${result.token}` };
      }

      ResponseUtil.success(res, responseData, 'File shared successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Share failed';
      ResponseUtil.error(res, 'SHARE_ERROR', message);
    }
  }

  /**
   * GET /api/share/:token
   * Access a shared file via public link
   */
  async getSharedFile(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token || typeof token !== 'string') {
        ResponseUtil.validationError(res, 'Invalid token');
        return;
      }

      const { share, file, isExpired } = await this.getSharedFileUseCase.execute(token);

      if (isExpired) {
        ResponseUtil.error(res, 'LINK_EXPIRED', 'This link has expired', 410);
        return;
      }

      // Generate a download URL (presigned)
      // For PUBLIC_LINK, permissions are typically VIEW/DOWNLOAD.
      // If permission is VIEW, maybe only generate a short-lived view URL.

      // Let's generate a temporary download URL regardless, valid for e.g. 1 hour
      const downloadUrl = await this.storageService.generatePresignedUrl(file.storageKey, 3600);

      let thumbnailUrl: string | undefined;
      if (file.thumbnailKey) {
        thumbnailUrl = await this.storageService.generatePresignedUrl(file.thumbnailKey, 3600);
      }

      ResponseUtil.success(res, {
        file: {
          name: file.name,
          size: file.size.toString(),
          mimeType: file.mimeType,
          downloadUrl: downloadUrl,
          thumbnailUrl: thumbnailUrl,
        },
        permission: share.permission,
        expiresAt: share.expiresAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access failed';
      ResponseUtil.error(res, 'ACCESS_SHARE_ERROR', message, 404);
    }
  }

  /**
   * GET /api/files/shared
   * List files shared with the current user internally
   */
  async listSharedWithMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const result = await this.listSharedWithMeUseCase.execute(req.user.id);

      // Optionally enrich with thumbnails (keeping it simple for now)
      // We can map over files and folders to add thumbnails if desired
      const enrichedFiles = await Promise.all(
        result.files.map(async (item: any) => {
          // If we had the thumbnailKey here we could generate it.
          // For now, use the DTO as is.
          return item;
        })
      );

      ResponseUtil.success(res, {
        files: enrichedFiles,
        folders: result.folders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'List shared failed';
      ResponseUtil.error(res, 'LIST_SHARED_ERROR', message);
    }
  }
}
