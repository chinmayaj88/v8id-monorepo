import { File } from '../../infrastructure/database/index.js';
import { FileItemDTO } from '../dtos/files/file-item.dto.js';

export class FileMapper {
  static toDTO(file: File, options?: { isOwner?: boolean; ownerName?: string }): FileItemDTO {
    const isOwner = options?.isOwner ?? true;
    const ownerName = options?.ownerName ?? 'Me';

    return {
      id: file.id,
      name: file.name,
      size: file.size.toString(),
      mimeType: file.mimeType,
      folderId: file.folderId || null,
      extension: file.extension,
      thumbnailKey: file.thumbnailKey || undefined,
      thumbnailUrl: file.thumbnailKey ? `api/files/${file.id}/thumbnail` : null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      isOwner,
      ownerName,
      tier: file.storageTier,
      sharedUsers: (file as any).fileShares
        ? (file as any).fileShares.map((s: any) => ({
            shareId: s.id,
            name: s.sharedWith,
            avatarUrl: null,
          }))
        : [],
    };
  }

  static toRecentDTO(file: any, userId: string): any {
    return {
      ...this.toDTO(file, {
        isOwner: file.userId === userId,
        ownerName: (file as any).ownerName || (file.userId === userId ? 'Me' : 'Unknown'),
      }),
      isShared: file.userId !== userId || !!(file as any).sharePermission,
    };
  }

  static toFolderDTO(folder: any, options?: { isOwner?: boolean; ownerName?: string }): any {
    const isOwner = options?.isOwner ?? true;
    const ownerName = options?.ownerName ?? 'Me';

    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId || null,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      isOwner,
      ownerName,
      sharedUsers: (folder as any).folderShares
        ? (folder as any).folderShares.map((s: any) => ({
            shareId: s.id,
            name: s.sharedWith,
            avatarUrl: null,
          }))
        : (folder as any).owner
          ? [
              {
                name: `${(folder as any).owner.firstName} ${(folder as any).owner.lastName || ''}`.trim(),
                avatarUrl: (folder as any).owner.avatarPath || null,
              },
            ]
          : [],
    };
  }
}
