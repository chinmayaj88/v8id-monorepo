import { File, Folder } from '../../../../generated/prisma/index.js';
import { IFileRepository, IFolderRepository } from '../../interfaces/index.js';

export interface SyncDTO {
  since?: Date;
}

export interface SyncResult {
  files: any[];
  folders: Folder[];
  lastSync: Date;
}

export class SyncUseCase {
  constructor(
    private fileRepository: IFileRepository,
    private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, dto: SyncDTO): Promise<SyncResult> {
    const { since } = dto;
    const now = new Date();

    let files: File[] = [];
    let folders: Folder[] = [];

    if (since) {
      // Delta Sync
      files = await this.fileRepository.findUpdatedSince(userId, since);
      folders = await this.folderRepository.findUpdatedSince(userId, since);
    } else {
      // Full Sync (Initial Load) - reusing findAll logic but we want everything relevant
      // For initial sync, we might just want everything active.
      // Reuse findUpdatedSince with a very old date? Or just getAll?
      // findAllByUserId supports options, but we want EVERYTHING for full sync or specific logic?
      // Actually, findAllByUserId with no options gets everything (paginated?).
      // Wait, findUpdatedSince(epoch) is equivalent to getAll.

      const epoch = new Date(0);
      files = await this.fileRepository.findUpdatedSince(userId, epoch);
      folders = await this.folderRepository.findUpdatedSince(userId, epoch);
    }

    return {
      files: files.map(f => ({
        ...f,
        size: f.size.toString(),
        thumbnailUrl: f.thumbnailKey ? `api/files/${f.id}/thumbnail` : null,
      })),
      folders,
      lastSync: now,
    };
  }
}
