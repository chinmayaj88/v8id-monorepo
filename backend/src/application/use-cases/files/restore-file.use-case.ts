import { IFileRepository } from '../../interfaces/files/file-repository.interface.js';

export class RestoreFileUseCase {
  constructor(private readonly fileRepository: IFileRepository) {}

  async execute(fileId: string, userId: string): Promise<void> {
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!file.isDeleted) {
      return; // Already restored
    }

    // Check if parent folder is deleted?
    // If parent is deleted, we might restore it to root or error?
    // For now, simple restore.

    await this.fileRepository.restore(fileId);
  }
}
