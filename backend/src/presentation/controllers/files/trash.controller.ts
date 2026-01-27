import { Response } from 'express';
import { ListTrashUseCase } from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class TrashController {
  constructor(private listTrashUseCase: ListTrashUseCase) {}

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Optional pagination
      // const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      // const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const result = await this.listTrashUseCase.execute(req.user.id, {
        // limit,
        // offset
      });

      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list trash';
      ResponseUtil.error(res, 'LIST_TRASH_ERROR', message);
    }
  }
}
