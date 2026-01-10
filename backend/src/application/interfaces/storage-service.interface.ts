/**
 * Storage Service Interface
 * 
 * Defines the contract for object storage operations (OCI Object Storage).
 */

export interface IStorageService {
  /**
   * Upload file to object storage
   */
  uploadFile(params: {
    objectName: string;
    file: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{
    objectName: string;
    etag: string;
    size: number;
  }>;

  /**
   * Download file from object storage
   */
  downloadFile(objectName: string): Promise<{
    file: Buffer;
    contentType: string;
    contentLength: number;
    metadata?: Record<string, string>;
  }>;

  /**
   * Delete file from object storage
   */
  deleteFile(objectName: string): Promise<void>;

  /**
   * Check if file exists in storage
   */
  fileExists(objectName: string): Promise<boolean>;

  /**
   * Get file metadata from storage
   */
  getFileMetadata(objectName: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>;

  /**
   * Generate pre-signed URL for temporary file access
   */
  generatePresignedUrl(objectName: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Copy file within storage
   */
  copyFile(sourceObjectName: string, destinationObjectName: string): Promise<void>;

  /**
   * Get file size
   */
  getFileSize(objectName: string): Promise<number>;
}
