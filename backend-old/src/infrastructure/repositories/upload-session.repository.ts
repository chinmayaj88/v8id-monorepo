/**
 * Upload Session Repository Implementation
 * 
 * Concrete implementation of IUploadSessionRepository using Prisma.
 */

import { prisma } from '../database/index.js';
import { IUploadSessionRepository } from '../../application/interfaces/upload-session-repository.interface.js';
import { UploadSession, UploadMethod } from '../../domain/entities/upload-session.js';
import { StorageTier } from '../../domain/entities/file.js';
import type { PrismaUploadSession, PrismaUploadSessionWhereInput, PrismaUploadSessionUpdateInput } from './types.js';

export class UploadSessionRepository implements IUploadSessionRepository {
  private toDomain(prismaSession: PrismaUploadSession): UploadSession {
    return new UploadSession(
      prismaSession.id,
      prismaSession.userId,
      prismaSession.fileName,
      prismaSession.fileSize,
      prismaSession.mimeType,
      prismaSession.folderId ?? null,
      prismaSession.chunkSize,
      prismaSession.totalChunks,
      prismaSession.uploadedChunks,
      prismaSession.uploadedBytes,
      prismaSession.uploadMethod as UploadMethod,
      prismaSession.parUrl ?? null,
      prismaSession.parId ?? null,
      prismaSession.ociObjectName ?? null,
      prismaSession.hash ?? null,
      (prismaSession.storageTier as StorageTier) || StorageTier.STANDARD, // Default to STANDARD for backward compatibility
      prismaSession.isCompleted,
      prismaSession.expiresAt,
      prismaSession.createdAt,
      prismaSession.updatedAt
    );
  }

  async findById(id: string): Promise<UploadSession | null> {
    const session = await prisma.uploadSession.findUnique({
      where: { id },
    });

    if (!session) {
      return null;
    }

    return this.toDomain(session);
  }

  async create(sessionData: {
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
  }): Promise<UploadSession> {
    const session = await prisma.uploadSession.create({
      data: {
        userId: sessionData.userId,
        fileName: sessionData.fileName,
        fileSize: sessionData.fileSize,
        mimeType: sessionData.mimeType,
        folderId: sessionData.folderId ?? null,
        chunkSize: sessionData.chunkSize,
        totalChunks: sessionData.totalChunks,
        uploadedChunks: 0,
        uploadedBytes: BigInt(0),
        uploadMethod: sessionData.uploadMethod,
        parUrl: sessionData.parUrl ?? null,
        parId: sessionData.parId ?? null,
        ociObjectName: sessionData.ociObjectName ?? null,
        storageTier: sessionData.storageTier || StorageTier.STANDARD, // Default to STANDARD
        isCompleted: false,
        expiresAt: sessionData.expiresAt,
      },
    });

    return this.toDomain(session);
  }

  async update(id: string, data: Partial<{
    uploadedChunks?: number;
    uploadedBytes?: bigint;
    hash?: string | null;
    isCompleted?: boolean;
    ociObjectName?: string | null;
  }>): Promise<UploadSession> {
    const updateData: PrismaUploadSessionUpdateInput = {};
    
    if (data.uploadedChunks !== undefined) updateData.uploadedChunks = data.uploadedChunks;
    if (data.uploadedBytes !== undefined) updateData.uploadedBytes = data.uploadedBytes;
    if (data.hash !== undefined) updateData.hash = data.hash ?? null;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
    if (data.ociObjectName !== undefined) updateData.ociObjectName = data.ociObjectName ?? null;

    const session = await prisma.uploadSession.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(session);
  }

  async delete(id: string): Promise<void> {
    await prisma.uploadSession.delete({
      where: { id },
    });
  }

  async findByUserId(userId: string, options?: {
    isCompleted?: boolean;
    includeExpired?: boolean;
  }): Promise<UploadSession[]> {
    const now = new Date();
    const where: PrismaUploadSessionWhereInput = {
      userId,
      ...(options?.isCompleted !== undefined && { isCompleted: options.isCompleted }),
      ...(options?.includeExpired === false && { expiresAt: { gt: now } }),
    };

    const sessions = await prisma.uploadSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(s => this.toDomain(s));
  }

  async findExpiredSessions(): Promise<UploadSession[]> {
    const now = new Date();
    const sessions = await prisma.uploadSession.findMany({
      where: {
        expiresAt: { lt: now },
        isCompleted: false,
      },
    });

    return sessions.map(s => this.toDomain(s));
  }
}
