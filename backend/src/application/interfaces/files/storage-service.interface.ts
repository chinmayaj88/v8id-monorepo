import { StorageTier } from '../../../../generated/prisma/index.js';

export interface IStorageService {
  uploadFile(params: {
    objectName: string;
    file: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
    tier?: StorageTier; // Optional tier for tier-aware storage services
  }): Promise<{
    objectName: string;
    etag: string;
    size: number;
  }>;

  downloadFile(
    objectName: string,
    tier?: StorageTier
  ): Promise<{
    file: Buffer;
    contentType: string;
    contentLength: number;
    metadata?: Record<string, string>;
  }>;

  deleteFile(objectName: string, tier?: StorageTier): Promise<void>;

  fileExists(objectName: string, tier?: StorageTier): Promise<boolean>;

  getFileMetadata(
    objectName: string,
    tier?: StorageTier
  ): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>;

  generatePresignedUrl(
    objectName: string,
    expiresInSeconds?: number,
    tier?: StorageTier
  ): Promise<string>;

  /**
   * Create Pre-Authenticated Request (PAR) for direct upload
   */
  createPreAuthenticatedRequest(params: {
    objectName: string;
    expiresInHours?: number;
    accessType?: 'ObjectRead' | 'ObjectWrite' | 'ObjectReadWrite';
    tier?: StorageTier;
  }): Promise<{
    parUrl: string;
    parId: string;
  }>;

  /**
   * Delete Pre-Authenticated Request (PAR)
   */
  deletePreAuthenticatedRequest(parId: string, tier?: StorageTier): Promise<void>;

  copyFile(
    sourceObjectName: string,
    destinationObjectName: string,
    tier?: StorageTier
  ): Promise<void>;

  getFileSize(objectName: string, tier?: StorageTier): Promise<number>;

  /**
   * Generate an optimized thumbnail for an image buffer using Sharp.
   */
  generateThumbnail(fileBuffer: Buffer): Promise<Buffer>;
}
