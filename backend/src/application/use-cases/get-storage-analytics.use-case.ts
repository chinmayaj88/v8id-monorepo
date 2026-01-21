/**
 * Get Storage Analytics Use Case
 *
 * Retrieves detailed storage usage analytics for a user.
 */

import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { IFileRepository } from '../interfaces/file-repository.interface.js';
import { FileType } from '../../domain/entities/file.js';

export interface StorageAnalyticsResponse {
  totalUsed: string;
  totalQuota: string;
  usageByTier: {
    standard: string;
    archive: string;
  };
  usageByType: {
    images: string;
    videos: string;
    audio: string;
    documents: string;
    archives: string;
    others: string;
  };
}

export class GetStorageAnalyticsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string): Promise<StorageAnalyticsResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const analytics = await this.fileRepository.getStorageAnalytics(userId);

    // We could simple sum the values from analytics, or trust user.storageUsed
    // Better to sum them to be consistent with the breakdown
    let totalUsed = BigInt(0);
    Object.values(analytics).forEach(val => {
      totalUsed += val;
    });

    // Note: This matches the breakdown sum, but user.storageUsed might be slightly different
    // if there are consistency issues, but we'll use the user entity for total usually.
    // For specific analytics page, the sum of parts is better UX (parts add up to total).

    return {
      totalUsed: totalUsed.toString(),
      totalQuota: user.storageQuota.toString(),
      usageByTier: {
        standard: totalUsed.toString(), // TODO: break down by tier if needed later
        archive: '0',
      },
      usageByType: {
        images: analytics[FileType.IMAGE].toString(),
        videos: analytics[FileType.VIDEO].toString(),
        audio: analytics[FileType.AUDIO].toString(),
        documents: analytics[FileType.DOCUMENT].toString(),
        archives: analytics[FileType.ARCHIVE].toString(),
        others: analytics[FileType.OTHER].toString(),
      },
    };
  }
}
