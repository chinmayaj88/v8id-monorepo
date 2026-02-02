import { ShareType, SharePermission, FileShare } from '../../../infrastructure/database/index.js';
import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateShareInput {
  fileId: string;
  ownerId: string;
  type: ShareType;
  permission: SharePermission;
  email?: string; // Required for INTERNAL
  expiresInSeconds?: number; // Optional for PUBLIC_LINK
}

export class CreateFileShareUseCase {
  constructor(
    private shareRepository: IShareRepository,
    private userRepository: IUserRepository,
    private fileRepository: IFileRepository
  ) {}

  async execute(input: CreateShareInput): Promise<FileShare> {
    const file = await this.fileRepository.findById(input.fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== input.ownerId) {
      throw new Error('You do not have permission to share this file');
    }

    let sharedWith: string | undefined;
    let token: string | undefined;
    let expiresAt: Date | undefined;

    if (input.type === ShareType.INTERNAL) {
      if (!input.email) {
        throw new Error('Email is required for internal sharing');
      }
      // Check if user exists (optional, could just share by email to invite later)
      // const user = await this.userRepository.findByEmail(input.email);
      // if (!user) throw new Error('User not found');
      sharedWith = input.email;
    } else if (input.type === ShareType.PUBLIC_LINK) {
      token = uuidv4(); // Generate unique token
      if (input.expiresInSeconds) {
        expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
      }
    }

    return this.shareRepository.createFileShare({
      fileId: input.fileId,
      ownerId: input.ownerId,
      type: input.type,
      permission: input.permission,
      sharedWith,
      token,
      expiresAt,
    });
  }
}
