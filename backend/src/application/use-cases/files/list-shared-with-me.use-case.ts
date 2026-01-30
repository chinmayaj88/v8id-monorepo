import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { ListSharedWithMeResult } from '../../dtos/files/file-item.dto.js';

export class ListSharedWithMeUseCase {
  constructor(
    private shareRepository: IShareRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<ListSharedWithMeResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [fileShares, folderShares] = await Promise.all([
      this.shareRepository.findFileSharesByEmail(user.email),
      this.shareRepository.findFolderSharesByEmail(user.email),
    ]);

    return {
      files: fileShares.map((s: any) => ({
        id: s.id,
        permission: s.permission,
        sharedAt: s.createdAt,
        file: {
          id: s.file.id,
          name: s.file.name,
          size: s.file.size.toString(),
          mimeType: s.file.mimeType,
          extension: s.file.extension,
          createdAt: s.file.createdAt,
          updatedAt: s.file.updatedAt,
          isOwner: false,
          ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          tier: s.file.storageTier,
          sharedUsers: [
            {
              name: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
              avatarUrl: s.owner.avatarPath,
            },
          ],
        },
      })),
      folders: folderShares.map((s: any) => ({
        id: s.id,
        permission: s.permission,
        sharedAt: s.createdAt,
        folder: {
          id: s.folder.id,
          name: s.folder.name,
          createdAt: s.folder.createdAt,
          updatedAt: s.folder.updatedAt,
          isOwner: false,
          ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
          sharedUsers: [
            {
              name: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
              avatarUrl: s.owner.avatarPath,
            },
          ],
        },
      })),
    };
  }
}
