/**
 * Upload Session Entity
 * 
 * Represents an upload session for chunked/resumable file uploads.
 */

import { StorageTier } from './file';

export enum UploadMethod {
  DIRECT = 'DIRECT', // Direct upload via PAR (Pre-Authenticated Request)
  BACKEND = 'BACKEND' // Upload through backend server
}

export class UploadSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly fileName: string,
    public readonly fileSize: bigint,
    public readonly mimeType: string,
    public readonly folderId: string | null,
    public readonly chunkSize: number,
    public readonly totalChunks: number,
    public readonly uploadedChunks: number,
    public readonly uploadedBytes: bigint,
    public readonly uploadMethod: UploadMethod,
    public readonly parUrl: string | null,
    public readonly parId: string | null,
    public readonly ociObjectName: string | null,
    public readonly hash: string | null,
    public readonly storageTier: StorageTier, // Storage tier for the file being uploaded
    public readonly isCompleted: boolean,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if session is active (not completed and not expired)
   */
  isActive(): boolean {
    return !this.isCompleted && !this.isExpired();
  }

  /**
   * Get upload progress percentage
   */
  getProgress(): number {
    if (this.fileSize === BigInt(0)) return 0;
    return Math.min(100, Number((this.uploadedBytes * BigInt(100)) / this.fileSize));
  }

  /**
   * Get remaining bytes to upload
   */
  getRemainingBytes(): bigint {
    const remaining = this.fileSize - this.uploadedBytes;
    return remaining > BigInt(0) ? remaining : BigInt(0);
  }

  /**
   * Check if all chunks are uploaded
   */
  isFullyUploaded(): boolean {
    return this.uploadedChunks >= this.totalChunks;
  }

  /**
   * Get next chunk number to upload
   */
  getNextChunkNumber(): number {
    return this.uploadedChunks;
  }

  /**
   * Check if this is a direct upload (via PAR)
   */
  isDirectUpload(): boolean {
    return this.uploadMethod === UploadMethod.DIRECT;
  }

  /**
   * Check if this is a backend upload
   */
  isBackendUpload(): boolean {
    return this.uploadMethod === UploadMethod.BACKEND;
  }
}
