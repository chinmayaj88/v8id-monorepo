import { IUserRepository, IPasswordService } from '../../interfaces/index.js';

export interface UnlockVaultDTO {
  vaultPassword: string;
}

export class UnlockVaultUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService
  ) {}

  async execute(userId: string, dto: UnlockVaultDTO): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.vaultPasswordHash) {
      throw new Error(
        'Vault is not configured for this account. Please set up a vault password first.'
      );
    }

    const isValid = await this.passwordService.verifyPassword(
      dto.vaultPassword,
      user.vaultPasswordHash
    );

    if (!isValid) {
      throw new Error('Invalid vault password');
    }

    return true;
  }
}
