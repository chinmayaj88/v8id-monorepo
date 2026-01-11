/**
 * Storage Analytics Use Case
 * 
 * Get storage analytics including breakdown by type, folder usage, and trends.
 */

import { IFileRepository } from '../interfaces/file-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { FileType } from '../../domain/entities/file';

export interface StorageAnalyticsResult {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  breakdownByType: {
    type: FileType;
    count: number;
    size: number;
    percentage: number;
  }[];
  folderUsage: {
    folderId: string | null;
    folderName: string;
    fileCount: number;
    size: number;
    percentage: number;
  }[];
  recentActivity: {
    date: string;
    filesUploaded: number;
    storageAdded: number;
  }[];
}

export class StorageAnalyticsUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<StorageAnalyticsResult> {
    // 1. Get user storage info
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const totalStorage = Number(user.storageQuota);
    const usedStorage = Number(user.storageUsed);
    const availableStorage = totalStorage - usedStorage;

    // 2. Get breakdown by file type
    const breakdownByType = await this.getBreakdownByType(userId, usedStorage);

    // 3. Get folder usage
    const folderUsage = await this.getFolderUsage(userId, usedStorage);

    // 4. Get recent activity (last 30 days)
    const recentActivity = await this.getRecentActivity(userId);

    return {
      totalStorage,
      usedStorage,
      availableStorage,
      breakdownByType,
      folderUsage,
      recentActivity,
    };
  }

  private async getBreakdownByType(userId: string, totalSize: number): Promise<StorageAnalyticsResult['breakdownByType']> {
    const types: FileType[] = [
      FileType.DOCUMENT,
      FileType.IMAGE,
      FileType.VIDEO,
      FileType.AUDIO,
      FileType.ARCHIVE,
      FileType.OTHER,
    ];

    const breakdown = await Promise.all(
      types.map(async (type) => {
        const result = await this.fileRepository.findByUserId(userId, {
          type,
          status: undefined, // Include all active files
        });

        const size = result.files.reduce((sum, file) => sum + Number(file.size), 0);
        const percentage = totalSize > 0 ? (size / totalSize) * 100 : 0;

        return {
          type,
          count: result.total,
          size,
          percentage: Math.round(percentage * 100) / 100,
        };
      })
    );

    return breakdown.filter(b => b.count > 0);
  }

  private async getFolderUsage(userId: string, totalSize: number): Promise<StorageAnalyticsResult['folderUsage']> {
    const foldersResult = await this.folderRepository.findByUserId(userId, {
      includeDeleted: false,
    });

    const folderUsage: StorageAnalyticsResult['folderUsage'] = await Promise.all(
      foldersResult.folders.map(async (folder) => {
        const filesResult = await this.fileRepository.findByFolderId(folder.id, userId, {
          status: undefined,
        });

        const size = filesResult.files.reduce((sum, file) => sum + Number(file.size), 0);
        const percentage = totalSize > 0 ? (size / totalSize) * 100 : 0;

        return {
          folderId: folder.id,
          folderName: folder.name,
          fileCount: filesResult.total,
          size,
          percentage: Math.round(percentage * 100) / 100,
        };
      })
    );

    // Add root folder usage
    const rootFilesResult = await this.fileRepository.findRootFiles(userId, {
      status: undefined,
    });
    const rootSize = rootFilesResult.files.reduce((sum, file) => sum + Number(file.size), 0);
    const rootPercentage = totalSize > 0 ? (rootSize / totalSize) * 100 : 0;

    folderUsage.unshift({
      folderId: null,
      folderName: 'Root',
      fileCount: rootFilesResult.total,
      size: rootSize,
      percentage: Math.round(rootPercentage * 100) / 100,
    });

    return folderUsage.filter(f => f.size > 0).sort((a, b) => b.size - a.size).slice(0, 10); // Top 10
  }

  private async getRecentActivity(userId: string): Promise<StorageAnalyticsResult['recentActivity']> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allFilesResult = await this.fileRepository.findByUserId(userId, {
      status: undefined,
    });

    const filesByDate = new Map<string, { count: number; size: number }>();

    allFilesResult.files.forEach((file) => {
      if (file.createdAt >= thirtyDaysAgo) {
        const dateKey = file.createdAt.toISOString().split('T')[0];
        if (dateKey) {
          const existing = filesByDate.get(dateKey) || { count: 0, size: 0 };
            filesByDate.set(dateKey, {
            count: existing.count + 1,
            size: existing.size + Number(file.size),
          });
        }
      }
    });

    const activity = Array.from(filesByDate.entries())
      .map(([date, data]) => ({
        date,
        filesUploaded: data.count,
        storageAdded: data.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return activity;
  }
}
