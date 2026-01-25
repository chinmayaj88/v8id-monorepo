import { Response } from 'express';
import {
  CreateFolderUseCase,
  ListFolderContentsUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class FolderController {
  constructor(
    private createFolderUseCase: CreateFolderUseCase,
    private listFolderContentsUseCase: ListFolderContentsUseCase
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

      const contents = await this.listFolderContentsUseCase.execute(req.user.id, {
        parentId,
        limit,
        offset,
      });

      ResponseUtil.success(res, contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list folder contents';
      ResponseUtil.error(res, 'LIST_FOLDER_ERROR', message);
    }
  }
}
