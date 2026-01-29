import { IVaultRepository } from '../../interfaces/vault/vault-repository.interface.js';
import { VaultSecretListItem } from './list-vault-secrets.use-case.js';

export class SearchVaultSecretsUseCase {
  constructor(private vaultRepository: IVaultRepository) {}

  async execute(userId: string, query: string): Promise<VaultSecretListItem[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const secrets = await this.vaultRepository.search(userId, query);

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
