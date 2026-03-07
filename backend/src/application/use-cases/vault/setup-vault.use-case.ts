import { IUserRepository, IPasswordService } from '../../interfaces/index.js';

export interface SetupVaultDTO {
  vaultPassword: string;
}

export class SetupVaultUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService
  ) {}

  async execute(userId: string, dto: SetupVaultDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.vaultPasswordHash) {
      throw new Error('Vault is already configured.');
    }

    if (!dto.vaultPassword || dto.vaultPassword.length < 8) {
      throw new Error('Vault password must be at least 8 characters long');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.vaultPassword);

    await this.userRepository.update(userId, {
      vaultPasswordHash: passwordHash,
    });
  }
}
