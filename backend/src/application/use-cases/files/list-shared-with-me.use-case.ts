import { FileShare } from '../../../../generated/prisma/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export class ListSharedWithMeUseCase {
  constructor(
    private shareRepository: IShareRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<FileShare[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.shareRepository.findFileSharesByEmail(user.email);
  }
}
