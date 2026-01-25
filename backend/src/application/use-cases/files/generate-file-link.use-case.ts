import { IFileRepository, IStorageService } from '../../interfaces/index.js';
import { StorageTier } from '../../../../generated/prisma/index.js';

/**
 * Result of generating a file link
 */
export interface FileLinkResult {
  id: string;
  linkToken: string; // Internal reference
  linkUrl: string; // The actual Pre-signed URL
  expiresAt: Date;
  maxDownloads?: number;
  downloadCount: number;
}

/**
 * Use case to generate a secure, short-lived download link for a file
 */
export class GenerateFileLinkUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private storageService: IStorageService
  ) {}

  async execute(userId: string, fileId: string): Promise<FileLinkResult> {
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Unauthorized access to file');
    }

    // Default expiration: 1 hour
    const expiresInSeconds = 3600;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Map storage tier
    const storageTier =
      (file.storageTier as string) === 'ARCHIVE' ? StorageTier.ARCHIVE : StorageTier.STANDARD;

    // Generate Pre-signed URL (PAR) from OCI
    const parUrl = await this.storageService.generatePresignedUrl(
      file.storageKey,
      expiresInSeconds,
      storageTier
    );

    return {
      id: file.id,
      linkToken: `par-${file.id}-${Date.now()}`, // Temporary internal token
      linkUrl: parUrl,
      expiresAt,
      downloadCount: 0,
    };
  }
}
