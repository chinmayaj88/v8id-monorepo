/**
 * Initiate Upload Use Case
 * 
 * Determines upload method (direct via PAR or through backend) based on file size.
 * Creates upload session for chunked/resumable uploads.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IFolderRepository } from '../interfaces/folder-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { UploadMethod } from '../../domain/entities/upload-session';

export interface InitiateUploadDTO {
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string | null;
  chunkSize?: number;
}

export interface InitiateUploadResult {
  sessionId: string;
  uploadMethod: 'DIRECT' | 'BACKEND';
  chunkSize: number;
  totalChunks: number;
  parUrl?: string;
  virusScanWarning?: boolean;
  message?: string;
}

export class InitiateUploadUseCase {
  private readonly DIRECT_UPLOAD_THRESHOLD = BigInt(process.env.DIRECT_UPLOAD_THRESHOLD_BYTES || '10485760');
  private readonly DEFAULT_CHUNK_SIZE = parseInt(process.env.UPLOAD_CHUNK_SIZE_BYTES || '5242880', 10);
  private readonly SESSION_EXPIRATION_HOURS = parseInt(process.env.UPLOAD_SESSION_EXPIRATION_HOURS || '24', 10);

  constructor(
    private uploadSessionRepository: IUploadSessionRepository,
    private userRepository: IUserRepository,
    private folderRepository: IFolderRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, dto: InitiateUploadDTO): Promise<InitiateUploadResult> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isUserActive()) {
      throw new Error('User not found or inactive');
    }

    const fileSize = BigInt(dto.fileSize);
    if (user.hasExceededStorageQuota()) {
      throw new Error('Storage quota exceeded');
    }

    const availableStorage = user.getAvailableStorage();
    if (fileSize > availableStorage) {
      throw new Error(`Insufficient storage. Available: ${this.formatBytes(Number(availableStorage))}, Required: ${this.formatBytes(dto.fileSize)}`);
    }

    if (dto.folderId) {
      const folder = await this.folderRepository.findById(dto.folderId);
      if (!folder || folder.userId !== userId || !folder.isActive()) {
        throw new Error('Folder not found or access denied');
      }
    }

    const useDirectUpload = fileSize >= this.DIRECT_UPLOAD_THRESHOLD;
    const uploadMethod = useDirectUpload ? UploadMethod.DIRECT : UploadMethod.BACKEND;
    
    const chunkSize = dto.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(Number(fileSize) / chunkSize);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ociObjectName = `users/${userId}/files/${timestamp}-${randomString}-${dto.fileName}`;

    let parUrl: string | undefined;
    let parId: string | undefined;
    
    if (useDirectUpload) {
      try {
        const parResult = await this.storageService.createPreAuthenticatedRequest({
          objectName: ociObjectName,
          expiresInHours: this.SESSION_EXPIRATION_HOURS,
          accessType: 'ObjectWrite',
        });
        parUrl = parResult.parUrl;
        parId = parResult.parId;
      } catch (error) {
        throw new Error(`Failed to create direct upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_EXPIRATION_HOURS);

    const session = await this.uploadSessionRepository.create({
      userId,
      fileName: dto.fileName,
      fileSize,
      mimeType: dto.mimeType,
      folderId: dto.folderId || null,
      chunkSize,
      totalChunks,
      uploadMethod,
      parUrl: parUrl || null,
      parId: parId || null,
      ociObjectName,
      expiresAt,
    });

    const result: InitiateUploadResult = {
      sessionId: session.id,
      uploadMethod: uploadMethod as 'DIRECT' | 'BACKEND',
      chunkSize,
      totalChunks,
    };

    if (useDirectUpload && parUrl) {
      result.parUrl = parUrl;
      result.virusScanWarning = true;
      result.message = '⚠️ Large files are uploaded directly to storage and cannot be scanned for viruses. Please ensure the file is from a trusted source.';
    }

    return result;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
