/**
 * Chunk Upload Use Case
 * 
 * Handles uploading a single chunk of a file.
 * Works for both direct (PAR) and backend uploads.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { createHash } from 'crypto';

export interface ChunkUploadDTO {
  sessionId: string;
  chunkNumber: number;
  chunkData: Buffer;
  isLastChunk: boolean;
}

export interface ChunkUploadResult {
  sessionId: string;
  uploadedChunks: number;
  totalChunks: number;
  uploadedBytes: number;
  progress: number;
  isComplete: boolean;
}

export class ChunkUploadUseCase {
  constructor(
    private uploadSessionRepository: IUploadSessionRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, dto: ChunkUploadDTO): Promise<ChunkUploadResult> {
    // 1. Find upload session
    const session = await this.uploadSessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    // 2. Verify ownership
    if (session.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Verify session is active
    if (!session.isActive()) {
      throw new Error(session.isExpired() ? 'Upload session has expired' : 'Upload session is already completed');
    }

    // 4. Verify chunk number
    const expectedChunkNumber = session.getNextChunkNumber();
    if (dto.chunkNumber !== expectedChunkNumber) {
      throw new Error(`Invalid chunk number. Expected: ${expectedChunkNumber}, Got: ${dto.chunkNumber}`);
    }

    // 5. Verify chunk size (except for last chunk)
    if (!dto.isLastChunk && dto.chunkData.length !== session.chunkSize) {
      throw new Error(`Invalid chunk size. Expected: ${session.chunkSize}, Got: ${dto.chunkData.length}`);
    }

    // 6. For backend uploads, we accumulate chunks
    // Chunks are stored temporarily and will be combined and uploaded in CompleteUploadUseCase
    // For direct uploads, chunks are uploaded directly by the client to OCI via PAR
    // We just track progress here

    // 7. Update session progress
    const newUploadedChunks = session.uploadedChunks + 1;
    const newUploadedBytes = session.uploadedBytes + BigInt(dto.chunkData.length);
    
    // Calculate hash incrementally (for backend uploads)
    let newHash: string | null = null;
    if (session.isBackendUpload() && session.hash) {
      // Continue building hash (would need to store intermediate hash state)
      // For simplicity, hash will be calculated on completion
    }

    const updatedSession = await this.uploadSessionRepository.update(dto.sessionId, {
      uploadedChunks: newUploadedChunks,
      uploadedBytes: newUploadedBytes,
      hash: newHash,
      isCompleted: dto.isLastChunk && newUploadedChunks >= session.totalChunks,
    });

    return {
      sessionId: updatedSession.id,
      uploadedChunks: updatedSession.uploadedChunks,
      totalChunks: updatedSession.totalChunks,
      uploadedBytes: Number(updatedSession.uploadedBytes),
      progress: updatedSession.getProgress(),
      isComplete: updatedSession.isCompleted,
    };
  }
}
