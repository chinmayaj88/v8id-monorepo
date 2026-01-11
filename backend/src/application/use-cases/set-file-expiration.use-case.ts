/**
 * Set File Expiration Use Case
 * 
 * Set or update expiration date for a file (auto-delete).
 */

import { IFileRepository } from '../interfaces/file-repository.interface';

export interface SetFileExpirationDTO {
  expiresAt: Date | null; // null to remove expiration
}

export class SetFileExpirationUseCase {
  constructor(
    private fileRepository: IFileRepository
  ) {}

  async execute(userId: string, fileId: string, dto: SetFileExpirationDTO): Promise<void> {
    // 1. Find file
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.userId !== userId) {
      throw new Error('Access denied');
    }

    // 3. Validate expiration date (must be in future if set)
    if (dto.expiresAt && dto.expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    // 4. Update file expiration
    await this.fileRepository.update(fileId, {
      expiresAt: dto.expiresAt,
    });
  }
}
