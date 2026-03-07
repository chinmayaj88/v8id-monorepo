import { IShareRepository } from '../../interfaces/repositories/share.repository.interface.js';
import { IUserRepository } from '../../interfaces/user/user-repository.interface.js';
import { ListSharedWithMeResult } from '../../dtos/files/file-item.dto.js';
import { FileMapper } from '../../utils/file.mapper.js';

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

    const [incomingFileShares, incomingFolderShares, outgoingFileShares, outgoingFolderShares] =
      await Promise.all([
        this.shareRepository.findFileSharesByEmail(user.email),
        this.shareRepository.findFolderSharesByEmail(user.email),
        this.shareRepository.findFileSharesByOwner(userId),
        this.shareRepository.findFolderSharesByOwner(userId),
      ]);

    // Process Incoming (Shared With Me)
    const incomingFiles = incomingFileShares.map((s: any) => ({
      id: s.id,
      permission: s.permission,
      sharedAt: s.createdAt,
      file: FileMapper.toDTO(s.file, {
        isOwner: false,
        ownerName: `${s.owner.firstName} ${s.owner.lastName}`.trim(),
      }),
    }));

    const incomingFolders = incomingFolderShares.map((s: any) => ({
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
    }));

    // Process Outgoing (Shared By Me) - Group by File ID
    const outgoingFilesMap = new Map<string, any>();

    outgoingFileShares.forEach((s: any) => {
      if (!s.file) return;
      if (!outgoingFilesMap.has(s.file.id)) {
        outgoingFilesMap.set(s.file.id, {
          id: s.id, // Use one share ID as reference
          permission: s.permission,
          sharedAt: s.createdAt,
          file: FileMapper.toDTO(s.file, {
            isOwner: true,
            ownerName: 'Me',
          }),
        });
      }

      // Add recipient to sharedUsers
      const item = outgoingFilesMap.get(s.file.id);
      item.file.sharedUsers.push({
        name: s.sharedWith, // Email
        avatarUrl: null, // No avatar for external/email shares easily available
      });
    });

    const outgoingFoldersMap = new Map<string, any>();

    outgoingFolderShares.forEach((s: any) => {
      if (!s.folder) return;
      if (!outgoingFoldersMap.has(s.folder.id)) {
        outgoingFoldersMap.set(s.folder.id, {
          id: s.id,
          permission: s.permission,
          sharedAt: s.createdAt,
          folder: {
            id: s.folder.id,
            name: s.folder.name,
            createdAt: s.folder.createdAt,
            updatedAt: s.folder.updatedAt,
            isOwner: true,
            ownerName: 'Me',
            sharedUsers: [],
          },
        });
      }

      const item = outgoingFoldersMap.get(s.folder.id);
      item.folder.sharedUsers.push({
        name: s.sharedWith,
        avatarUrl: null,
      });
    });

    return {
      files: [...incomingFiles, ...Array.from(outgoingFilesMap.values())],
      folders: [...incomingFolders, ...Array.from(outgoingFoldersMap.values())],
    };
  }
}
