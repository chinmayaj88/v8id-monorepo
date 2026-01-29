import { VaultRepository } from '../../repositories/vault/vault.repository.js';
import { VaultEncryptionService } from '../../services/security/vault-encryption.service.js';
import {
  AddVaultSecretUseCase,
  ListVaultSecretsUseCase,
  GetVaultSecretUseCase,
  SearchVaultSecretsUseCase,
  DeleteVaultSecretUseCase,
} from '../../../application/use-cases/vault/index.js';
import { VaultController } from '../../../presentation/controllers/vault/vault.controller.js';

class VaultContainer {
  public readonly vaultRepository: VaultRepository;
  public readonly encryptionService: VaultEncryptionService;

  public readonly addSecretUseCase: AddVaultSecretUseCase;
  public readonly listSecretsUseCase: ListVaultSecretsUseCase;
  public readonly getSecretUseCase: GetVaultSecretUseCase;
  public readonly searchSecretsUseCase: SearchVaultSecretsUseCase;
  public readonly deleteSecretUseCase: DeleteVaultSecretUseCase;

  public readonly vaultController: VaultController;

  constructor() {
    this.vaultRepository = new VaultRepository();
    this.encryptionService = new VaultEncryptionService();

    this.addSecretUseCase = new AddVaultSecretUseCase(this.vaultRepository, this.encryptionService);
    this.listSecretsUseCase = new ListVaultSecretsUseCase(this.vaultRepository);
    this.getSecretUseCase = new GetVaultSecretUseCase(this.vaultRepository, this.encryptionService);
    this.searchSecretsUseCase = new SearchVaultSecretsUseCase(this.vaultRepository);
    this.deleteSecretUseCase = new DeleteVaultSecretUseCase(this.vaultRepository);

    this.vaultController = new VaultController(
      this.addSecretUseCase,
      this.listSecretsUseCase,
      this.getSecretUseCase,
      this.searchSecretsUseCase,
      this.deleteSecretUseCase
    );
  }
}

// Singleton instance
export const vaultContainer = new VaultContainer();
