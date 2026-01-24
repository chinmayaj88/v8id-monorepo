/**
 * Cancel Upload Use Case
 *
 * Cancels an ongoing chunked upload, cleans up partial data from OCI storage,
 * and removes the upload session record.
 */

import { IUploadSessionRepository } from '../interfaces/upload-session-repository.interface.js';
import { IStorageService } from '../interfaces/storage-service.interface.js';
import { StorageTier } from '../../domain/entities/file.js';
import { TierAwareStorageService } from '../../infrastructure/oci/tier-aware-storage.service.js';

export interface CancelUploadResult {
  success: boolean;
  message: string;
  sessionId: string;
}

export class CancelUploadUseCase {
  constructor(
    private uploadSessionRepository: IUploadSessionRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, sessionId: string): Promise<CancelUploadResult> {
    // Find the upload session
    const session = await this.uploadSessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Upload session not found');
    }

    // Verify ownership
    if (session.userId !== userId) {
      throw new Error('Access denied: You do not own this upload session');
    }

    // Check if already completed
    if (session.isCompleted) {
      throw new Error('Cannot cancel: Upload already completed');
    }

    // Try to delete partial file from OCI if it exists
    if (session.ociObjectName) {
      try {
        const tier = session.storageTier || StorageTier.STANDARD;
        const isTierAware = this.storageService instanceof TierAwareStorageService;

        if (isTierAware) {
          await (this.storageService as TierAwareStorageService).deleteFile(
            session.ociObjectName,
            tier
          );
        } else {
          await this.storageService.deleteFile(session.ociObjectName);
        }
      } catch (error) {
        // File may not exist yet, ignore delete errors
        console.log(`[CancelUpload] Could not delete partial file: ${error}`);
      }
    }

    // Delete any Pre-Authenticated Request if exists
    if (session.parId) {
      try {
        const tier = session.storageTier || StorageTier.STANDARD;
        const isTierAware = this.storageService instanceof TierAwareStorageService;

        if (isTierAware) {
          await (this.storageService as TierAwareStorageService).deletePreAuthenticatedRequest(
            session.parId,
            tier
          );
        }
      } catch (error) {
        // PAR may be expired or already deleted, ignore errors
        console.log(`[CancelUpload] Could not delete PAR: ${error}`);
      }
    }

    // Delete the upload session record
    await this.uploadSessionRepository.delete(sessionId);

    return {
      success: true,
      message: 'Upload cancelled successfully',
      sessionId,
    };
  }
}
