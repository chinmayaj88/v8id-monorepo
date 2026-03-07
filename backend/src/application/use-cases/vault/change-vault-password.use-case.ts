import { IUserRepository, IPasswordService } from '../../interfaces/index.js';

export interface ChangeVaultPasswordDTO {
  currentVaultPassword: string;
  newVaultPassword: string;
}

export class ChangeVaultPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService
  ) {}

  async execute(userId: string, dto: ChangeVaultPasswordDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.vaultPasswordHash) {
      throw new Error(
        'Vault is not configured for this account. Please set up a vault password first.'
      );
    }

    // Verify current vault password
    const isCurrentValid = await this.passwordService.verifyPassword(
      dto.currentVaultPassword,
      user.vaultPasswordHash
    );

    if (!isCurrentValid) {
      throw new Error('Current vault password is incorrect');
    }

    if (!dto.newVaultPassword || dto.newVaultPassword.length < 8) {
      throw new Error('New vault password must be at least 8 characters long');
    }

    if (dto.currentVaultPassword === dto.newVaultPassword) {
      throw new Error('New vault password must be different from the current password');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newVaultPassword);

    await this.userRepository.update(userId, {
      vaultPasswordHash: newPasswordHash,
    });
  }
}
