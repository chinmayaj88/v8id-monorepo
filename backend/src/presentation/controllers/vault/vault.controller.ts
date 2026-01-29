import { Response } from 'express';
import {
  AddVaultSecretUseCase,
  ListVaultSecretsUseCase,
  GetVaultSecretUseCase,
  SearchVaultSecretsUseCase,
  DeleteVaultSecretUseCase,
} from '../../../application/use-cases/index.js';
import { ResponseUtil } from '../../utils/response.util.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class VaultController {
  constructor(
    private addSecretUseCase: AddVaultSecretUseCase,
    private listSecretsUseCase: ListVaultSecretsUseCase,
    private getSecretUseCase: GetVaultSecretUseCase,
    private searchSecretsUseCase: SearchVaultSecretsUseCase,
    private deleteSecretUseCase: DeleteVaultSecretUseCase
  ) {}

  async addSecret(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const result = await this.addSecretUseCase.execute(req.user.id, req.body);
      ResponseUtil.created(res, result, 'Secret added to vault successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add secret';
      ResponseUtil.error(res, 'ADD_SECRET_ERROR', message);
    }
  }

  async listSecrets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const result = await this.listSecretsUseCase.execute(req.user.id);
      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list secrets';
      ResponseUtil.error(res, 'LIST_SECRETS_ERROR', message);
    }
  }

  async getSecret(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'Invalid secret ID');
        return;
      }
      const result = await this.getSecretUseCase.execute(req.user.id, id);
      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get secret';
      ResponseUtil.error(res, 'GET_SECRET_ERROR', message);
    }
  }

  async searchSecrets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const query = req.query.q as string;
      if (!query) {
        ResponseUtil.success(res, []);
        return;
      }
      const result = await this.searchSecretsUseCase.execute(req.user.id, query);
      ResponseUtil.success(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search secrets';
      ResponseUtil.error(res, 'SEARCH_SECRETS_ERROR', message);
    }
  }

  async deleteSecret(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        ResponseUtil.validationError(res, 'Invalid secret ID');
        return;
      }
      await this.deleteSecretUseCase.execute(req.user.id, id);
      ResponseUtil.success(res, undefined, 'Secret deleted from vault');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete secret';
      ResponseUtil.error(res, 'DELETE_SECRET_ERROR', message);
    }
  }
}
