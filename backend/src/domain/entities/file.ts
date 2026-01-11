/**
 * File Entity
 * 
 * Represents a file in the system with business logic.
 * This is a pure domain entity with no external dependencies.
 */

export enum FileType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER'
}

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED'
}

export class File {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly folderId: string | null,
    public readonly name: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: bigint,
    public readonly type: FileType,
    public readonly status: FileStatus,
    public readonly ociObjectName: string, // OCI Object Storage key
    public readonly hash: string, // SHA-256 hash for deduplication
    public readonly description?: string,
    public readonly tags?: string[],
    public readonly metadata?: Record<string, unknown>,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly deletedAt?: Date
  ) {}

  /**
   * Check if file is in root folder
   */
  isInRoot(): boolean {
    return this.folderId === null;
  }

  /**
   * Check if file is active (not deleted or archived)
   */
  isActive(): boolean {
    return this.status === FileStatus.ACTIVE;
  }

  /**
   * Check if file is deleted
   */
  isDeleted(): boolean {
    return this.status === FileStatus.DELETED;
  }

  /**
   * Check if file is currently being uploaded
   */
  isUploading(): boolean {
    return this.status === FileStatus.UPLOADING;
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    const parts = this.name.split('.');
    if (parts.length <= 1) {
      return '';
    }
    const extension = parts[parts.length - 1];
    return extension ? extension.toLowerCase() : '';
  }

  /**
   * Get human-readable file size
   */
  getFormattedSize(): string {
    const bytes = Number(this.size);
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    return this.type === FileType.IMAGE || this.mimeType.startsWith('image/');
  }

  /**
   * Check if file is a video
   */
  isVideo(): boolean {
    return this.type === FileType.VIDEO || this.mimeType.startsWith('video/');
  }

  /**
   * Check if file is a document
   */
  isDocument(): boolean {
    return this.type === FileType.DOCUMENT || 
           ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'].some(type => 
             this.mimeType.startsWith(type)
           );
  }

  /**
   * Check if file has a specific tag
   */
  hasTag(tag: string): boolean {
    return this.tags?.includes(tag) ?? false;
  }

  /**
   * Check if file can be deleted (must be active)
   */
  canBeDeleted(): boolean {
    return this.isActive();
  }

  /**
   * Check if file can be restored (must be deleted)
   */
  canBeRestored(): boolean {
    return this.isDeleted() && this.deletedAt !== undefined;
  }

  /**
   * Get age of file in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
