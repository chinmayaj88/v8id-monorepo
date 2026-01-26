import { StorageTier } from '../../domain/entities/file.js';

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

  downloadFile(objectName: string): Promise<{
    file: Buffer;
    contentType: string;
    contentLength: number;
    metadata?: Record<string, string>;
  }>;

  deleteFile(objectName: string): Promise<void>;


  fileExists(objectName: string): Promise<boolean>;

  getFileMetadata(objectName: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>;

  generatePresignedUrl(objectName: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Create Pre-Authenticated Request (PAR) for direct upload
   */
  createPreAuthenticatedRequest(params: {
    objectName: string;
    expiresInHours?: number;
    accessType?: 'ObjectRead' | 'ObjectWrite' | 'ObjectReadWrite';
  }): Promise<{
    parUrl: string;
    parId: string;
  }>;

  /**
   * Delete Pre-Authenticated Request (PAR)
   */
  deletePreAuthenticatedRequest(parId: string): Promise<void>;

  copyFile(sourceObjectName: string, destinationObjectName: string): Promise<void>;

  getFileSize(objectName: string): Promise<number>;
}
