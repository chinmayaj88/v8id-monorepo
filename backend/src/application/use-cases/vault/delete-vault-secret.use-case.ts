import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';

export class DeleteVaultSecretUseCase {
  constructor(private vaultRepository: IVaultRepository) {}

  async execute(userId: string, secretId: string): Promise<void> {
    const secret = await this.vaultRepository.findById(secretId);

    if (!secret) {
      throw new Error('Secret not found');
    }

    if (secret.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.vaultRepository.delete(secretId);
  }
}
