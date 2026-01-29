import { Response } from 'express';
import { SearchFilesUseCase } from '../../application/use-cases/index.js';
import { ResponseUtil } from '../utils/response.util.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class SearchController {
  constructor(private searchFilesUseCase: SearchFilesUseCase) {}

  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const query = (req.query.q as string) || '';
      const type = (req.query.type as 'all' | 'folder' | 'file' | 'secret') || 'all';

      if (!query) {
        ResponseUtil.validationError(res, 'Query parameter "q" is required');
        return;
      }

      const results = await this.searchFilesUseCase.execute(req.user.id, {
        query,
        type,
      });

      ResponseUtil.success(res, results);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search files';
      ResponseUtil.error(res, 'SEARCH_ERROR', message);
    }
  }
}
