/**
 * Chunk Upload Use Case
 * 
 * Handles uploading a single chunk of a file.
 * Works for both direct (PAR) and backend uploads.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';

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
    const session = await this.uploadSessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Access denied');
    }

    if (!session.isActive()) {
      throw new Error(session.isExpired() ? 'Upload session has expired' : 'Upload session is already completed');
    }

    const expectedChunkNumber = session.getNextChunkNumber();
    if (dto.chunkNumber !== expectedChunkNumber) {
      throw new Error(`Invalid chunk number. Expected: ${expectedChunkNumber}, Got: ${dto.chunkNumber}`);
    }

    if (!dto.isLastChunk && dto.chunkData.length !== session.chunkSize) {
      throw new Error(`Invalid chunk size. Expected: ${session.chunkSize}, Got: ${dto.chunkData.length}`);
    }

    const newUploadedChunks = session.uploadedChunks + 1;
    const newUploadedBytes = session.uploadedBytes + BigInt(dto.chunkData.length);
    
    let newHash: string | null = null;

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
