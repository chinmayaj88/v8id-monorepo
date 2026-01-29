import { VaultSecret } from '../../../../generated/prisma/index.js';
import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';

export interface VaultSecretListItem {
  id: string;
  name: string;
  url: string | null;
  username: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListVaultSecretsUseCase {
  constructor(private vaultRepository: IVaultRepository) {}

  async execute(userId: string): Promise<VaultSecretListItem[]> {
    const secrets = await this.vaultRepository.findByUserId(userId);

    // Return only metadata for the list - passwords stay encrypted
    return secrets.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      username: s.username,
      category: s.category,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }
}
