import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';
import { VaultEncryptionService } from '../../../infrastructure/services/security/vault-encryption.service.js';
import { envConfig } from '../../../infrastructure/config/env.config.js';

export class GetVaultSecretUseCase {
  constructor(
    private vaultRepository: IVaultRepository,
    private encryptionService: VaultEncryptionService
  ) {}

  async execute(userId: string, secretId: string): Promise<any> {
    const secret = await this.vaultRepository.findById(secretId);

    if (!secret) {
      throw new Error('Secret not found');
    }

    if (secret.userId !== userId) {
      throw new Error('Unauthorized access to vault item');
    }

    // Decrypt the password
    const masterKey = envConfig.vaultMasterKey;
    const decryptedPassword = this.encryptionService.decrypt(
      secret.encryptedPassword,
      masterKey,
      secret.iv,
      secret.authTag
    );

    return {
      ...secret,
      password: decryptedPassword,
    };
  }
}
