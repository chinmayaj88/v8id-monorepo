import { VaultSecret } from '../../../../generated/prisma/index.js';
import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';
import { VaultEncryptionService } from '../../../infrastructure/services/security/vault-encryption.service.js';
import { envConfig } from '../../../infrastructure/config/env.config.js';

export interface AddVaultSecretDTO {
  name: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  category?: string;
}

export class AddVaultSecretUseCase {
  constructor(
    private vaultRepository: IVaultRepository,
    private encryptionService: VaultEncryptionService
  ) {}

  async execute(userId: string, dto: AddVaultSecretDTO): Promise<VaultSecret> {
    if (!dto.password) {
      throw new Error('Password is required for vault items');
    }

    // Encrypt the password using the master key
    const masterKey = envConfig.vaultMasterKey;
    const { encryptedData, iv, authTag } = this.encryptionService.encrypt(dto.password, masterKey);

    return this.vaultRepository.create({
      userId,
      name: dto.name,
      url: dto.url || null,
      username: dto.username || null,
      encryptedPassword: encryptedData,
      iv,
      authTag,
      notes: dto.notes || null,
      category: dto.category || 'GENERAL',
    });
  }
}
