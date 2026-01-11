/**
 * Resume Upload Use Case
 * 
 * Resumes an interrupted upload by returning current progress and next chunk number.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';

export interface ResumeUploadResult {
  sessionId: string;
  uploadMethod: 'DIRECT' | 'BACKEND';
  uploadedChunks: number;
  totalChunks: number;
  uploadedBytes: number;
  progress: number;
  nextChunkNumber: number;
  parUrl?: string; // Only for DIRECT uploads
  chunkSize: number;
  isExpired: boolean;
}

export class ResumeUploadUseCase {
  constructor(
    private uploadSessionRepository: IUploadSessionRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, sessionId: string): Promise<ResumeUploadResult> {
    // 1. Find upload session
    const session = await this.uploadSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    // 2. Verify ownership
    if (session.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Check if session is completed
    if (session.isCompleted) {
      throw new Error('Upload session is already completed');
    }

    // 4. Check if session is expired
    if (session.isExpired()) {
      throw new Error('Upload session has expired. Please start a new upload.');
    }

    // 5. For direct uploads, verify PAR is still valid
    let parUrl: string | undefined;
    if (session.isDirectUpload() && session.parId) {
      // PAR should still be valid (checked via expiration)
      parUrl = session.parUrl || undefined;
    }

    return {
      sessionId: session.id,
      uploadMethod: session.uploadMethod as 'DIRECT' | 'BACKEND',
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      uploadedBytes: Number(session.uploadedBytes),
      progress: session.getProgress(),
      nextChunkNumber: session.getNextChunkNumber(),
      parUrl,
      chunkSize: session.chunkSize,
      isExpired: false,
    };
  }
}
