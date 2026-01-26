/**
 * File Share Entity
 * 
 * Represents a share of a file or folder with another user.
 */

export enum SharePermission {
  READ = 'READ', // Can view and download
  WRITE = 'WRITE', // Can view, download, and modify
  VIEW_ONLY = 'VIEW_ONLY' // Can only view (no download)
}

export class FileShare {
  constructor(
    public readonly id: string,
    public readonly fileId: string | null,
    public readonly folderId: string | null,
    public readonly ownerId: string,
    public readonly sharedWithId: string,
    public readonly permission: SharePermission,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if this is a file share
   */
  isFileShare(): boolean {
    return this.fileId !== null;
  }

  /**
   * Check if this is a folder share
   */
  isFolderShare(): boolean {
    return this.folderId !== null;
  }

  /**
   * Check if user has write permission
   */
  hasWritePermission(): boolean {
    return this.permission === SharePermission.WRITE;
  }

  /**
   * Check if user has read permission
   */
  hasReadPermission(): boolean {
    return this.permission === SharePermission.READ || this.hasWritePermission();
  }

  /**
   * Check if user has view-only permission
   */
  isViewOnly(): boolean {
    return this.permission === SharePermission.VIEW_ONLY;
  }
}
