import { Response } from 'express';
import { SyncUseCase } from '../../../application/use-cases/sync/sync.use-case.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import crypto from 'crypto';

export class SyncController {
  constructor(private syncUseCase: SyncUseCase) {}

  async sync(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const sinceQuery = req.query.since as string;
      let since: Date | undefined;

      if (sinceQuery) {
        const parsed = parseInt(sinceQuery);
        if (!isNaN(parsed)) {
          since = new Date(parsed);
        } else {
          since = new Date(sinceQuery);
        }
      }

      const result = await this.syncUseCase.execute(req.user.id, { since });

      // Generate ETag based on the content or lastSync
      // Simple ETag: Hash of the stringified result
      // Or weaker ETag: `W/"${result.lastSync.getTime()}-${result.files.length}-${result.folders.length}"`

      const content = JSON.stringify(result);
      const hash = crypto.createHash('md5').update(content).digest('hex');
      const etag = `"${hash}"`;

      // Check If-None-Match
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('ETag', etag);
      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      ResponseUtil.error(res, 'SYNC_ERROR', message);
    }
  }
}
