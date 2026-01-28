import { Response } from 'express';
import { StorageTier } from '../../../../generated/prisma/index.js';
import {
  CreateFolderUseCase,
  ListFolderContentsUseCase,
  DeleteFolderUseCase,
  RestoreFolderUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class FolderController {
  constructor(
    private createFolderUseCase: CreateFolderUseCase,
    private listFolderContentsUseCase: ListFolderContentsUseCase,
    private deleteFolderUseCase: DeleteFolderUseCase,
    private restoreFolderUseCase: RestoreFolderUseCase
  ) {}

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { name, parentId } = req.body;
      const folder = await this.createFolderUseCase.execute(req.user.id, {
        name,
        parentId,
      });

      ResponseUtil.created(res, folder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder';
      ResponseUtil.error(res, 'CREATE_FOLDER_ERROR', message);
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const parentId = (req.query.parentId as string) || null;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      let tier: StorageTier | undefined;
      if (req.query.tier) {
        const tierStr = (req.query.tier as string).toUpperCase();
        if (tierStr === 'ARCHIVE') tier = StorageTier.ARCHIVE;
        else if (tierStr === 'STANDARD') tier = StorageTier.STANDARD;
      }

      const contents = await this.listFolderContentsUseCase.execute(req.user.id, {
        parentId,
        limit,
        offset,
        tier,
      });

      ResponseUtil.success(res, contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list folder contents';
      ResponseUtil.error(res, 'LIST_FOLDER_ERROR', message);
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
        ResponseUtil.validationError(res, 'Folder ID must be a string');
        return;
      }

      const { permanent } = req.query;
      const isPermanent = String(permanent).toLowerCase() === 'true';

      await this.deleteFolderUseCase.execute(id, req.user.id, isPermanent);

      ResponseUtil.success(res, {
        success: true,
        message: isPermanent ? 'Folder permanently deleted' : 'Folder moved to trash',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder';
      ResponseUtil.error(res, 'DELETE_FOLDER_ERROR', message);
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
        ResponseUtil.validationError(res, 'Folder ID must be a string');
        return;
      }

      await this.restoreFolderUseCase.execute(id, req.user.id);

      ResponseUtil.success(res, { success: true, message: 'Folder restored' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore folder';
      ResponseUtil.error(res, 'RESTORE_FOLDER_ERROR', message);
    }
  }
}
