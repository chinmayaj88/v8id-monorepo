import { IFileRepository } from '../../interfaces/index.js';

export class GetMediaAlbumsUseCase {
  constructor(private fileRepository: IFileRepository) {}

  async execute(userId: string, type: 'image' | 'video' | 'document') {
    const albums = await this.fileRepository.getMediaAlbums(userId, type);
    return albums.map(a => ({
      ...a,
      thumbnailUrl: a.thumbnailKey ? `api/files/${a.thumbnailFileId}/thumbnail` : null,
    }));
  }
}
