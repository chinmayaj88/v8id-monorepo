import { UploadSession, UploadMethod } from '../../../domain/entities/index.js';
import { StorageTier } from '../../../domain/entities/index.js';

export interface IUploadSessionRepository {
  findById(id: string): Promise<UploadSession | null>;
  
  create(sessionData: {
    userId: string;
    fileName: string;
    fileSize: bigint;
    mimeType: string;
    folderId?: string | null;
    chunkSize: number;
    totalChunks: number;
    uploadMethod: UploadMethod;
    parUrl?: string | null;
    parId?: string | null;
    ociObjectName?: string | null;
    storageTier?: StorageTier;
    expiresAt: Date;
  }): Promise<UploadSession>;

  update(id: string, data: Partial<{
    uploadedChunks?: number;
    uploadedBytes?: bigint;
    hash?: string | null;
    isCompleted?: boolean;
    ociObjectName?: string | null;
  }>): Promise<UploadSession>;

  delete(id: string): Promise<void>;

  findByUserId(userId: string, options?: {
    isCompleted?: boolean;
    includeExpired?: boolean;
  }): Promise<UploadSession[]>;

  findExpiredSessions(): Promise<UploadSession[]>;
}


