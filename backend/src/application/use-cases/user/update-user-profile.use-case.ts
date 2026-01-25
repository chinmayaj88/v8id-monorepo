/**
 * Update User Profile Use Case
 *
 * Handles profile updates including avatar upload.
 * Stores avatarPath in DB, generates fresh pre-signed URL on response.
 */

import { IUserRepository } from '../../interfaces/index.js';
import { IStorageService } from '../../interfaces/index.js';
import { StorageTier } from '../../../domain/entities/index.js';

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  avatarBuffer?: Buffer;
  avatarFileName?: string;
  avatarMimeType?: string;
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  firstName: string | undefined;
  lastName: string | undefined;
  avatarUrl: string | undefined;
  role: string;
  storageQuota: string;
  storageUsed: string;
  updatedAt: Date;
}

export class UpdateUserProfileUseCase {
  constructor(
    private userRepository: IUserRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, dto: UpdateProfileDTO): Promise<UpdateProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let avatarPath = user.avatarPath;

    if (dto.avatarBuffer && dto.avatarFileName && dto.avatarMimeType) {
      // Delete old avatar if exists
      if (user.avatarPath) {
        try {
          await this.storageService.deleteFile(user.avatarPath);
        } catch {
          // Continue if deletion fails - file may already be deleted
        }
      }

      // Upload new avatar
      const timestamp = Date.now();
      avatarPath = `avatars/${userId}/${timestamp}-${dto.avatarFileName}`;

      await this.storageService.uploadFile({
        objectName: avatarPath,
        file: dto.avatarBuffer,
        contentType: dto.avatarMimeType,
        metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
        },
        tier: 'STANDARD' as StorageTier,
      });
    }

    const updatedUser = await this.userRepository.update(userId, {
      firstName: dto.firstName !== undefined ? dto.firstName : user.firstName,
      lastName: dto.lastName !== undefined ? dto.lastName : user.lastName,
      avatarPath,
    });

    // Generate fresh pre-signed URL (valid for 1 hour)
    let avatarUrl: string | undefined;
    if (updatedUser.avatarPath) {
      try {
        avatarUrl = await this.storageService.generatePresignedUrl(updatedUser.avatarPath, 604800);
      } catch {
        // URL generation failed - return undefined
      }
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatarUrl,
      role: updatedUser.role,
      storageQuota: updatedUser.storageQuota.toString(),
      storageUsed: updatedUser.storageUsed.toString(),
      updatedAt: updatedUser.updatedAt,
    };
  }
}




