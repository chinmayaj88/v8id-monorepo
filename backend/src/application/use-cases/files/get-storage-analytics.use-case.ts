import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';

export interface StorageAnalyticsResult {
  totalUsage: string; // BigInt to string
  totalQuota: string;
  usagePercentage: number;
  breakdown: {
    images: string;
    videos: string;
    documents: string;
    audio: string;
    others: string;
  };
}

export class GetStorageAnalyticsUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<StorageAnalyticsResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const totalQuota = user.storageQuota;
    // We can use user.storageUsed for total, or sum up the breakdown.
    // user.storageUsed is faster, but breakdown sum is a good sanity check.
    // Let's use user.storageUsed for the official "total" to match the database state,
    // but the distribution will be calculated from files.
    // Note: If they drift (e.g. bug), distribution sum != total.
    // For "accurate" analytics as requested, querying the files is safer for the *breakdown*,
    // and user.storageUsed is safer for *quota enforcement*.
    // However, for the UI "what is taking space", we must use the file aggregation.

    const usgeByMime = await this.fileRepository.getStorageUsageByMimeType(userId);

    let images = BigInt(0);
    let videos = BigInt(0);
    let documents = BigInt(0);
    let audio = BigInt(0);
    let others = BigInt(0);
    let calculatedTotal = BigInt(0);

    for (const item of usgeByMime) {
      calculatedTotal += item.totalSize;

      if (item.mimeType.startsWith('image/')) {
        images += item.totalSize;
      } else if (item.mimeType.startsWith('video/')) {
        videos += item.totalSize;
      } else if (item.mimeType.startsWith('audio/')) {
        audio += item.totalSize;
      } else if (
        item.mimeType.startsWith('text/') ||
        item.mimeType.includes('pdf') ||
        item.mimeType.includes('word') ||
        item.mimeType.includes('document') ||
        item.mimeType.includes('sheet') ||
        item.mimeType.includes('presentation')
      ) {
        documents += item.totalSize;
      } else {
        others += item.totalSize;
      }
    }

    // Calculate percentage
    // Avoid division by zero
    let percentage = 0;
    if (totalQuota > BigInt(0)) {
      // Precision: (used * 100) / quota
      percentage = Number((calculatedTotal * BigInt(10000)) / totalQuota) / 100;
    }

    return {
      totalUsage: calculatedTotal.toString(),
      totalQuota: totalQuota.toString(),
      usagePercentage: percentage,
      breakdown: {
        images: images.toString(),
        videos: videos.toString(),
        documents: documents.toString(),
        audio: audio.toString(),
        others: others.toString(),
      },
    };
  }
}
