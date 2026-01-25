/**
 * Folder Entity
 * 
 * Represents a folder in the system with business logic.
 * Folders are used to organize files hierarchically.
 * This is a pure domain entity with no external dependencies.
 */

export class Folder {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly parentId: string | null,
    public readonly name: string,
    public readonly description?: string,
    public readonly color?: string, // For UI display
    public readonly isDeleted: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly deletedAt?: Date
  ) {}

  /**
   * Check if folder is root folder (no parent)
   */
  isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * Check if folder is active (not deleted)
   */
  isActive(): boolean {
    return !this.isDeleted;
  }

  /**
   * Check if folder can be deleted (must be active)
   */
  canBeDeleted(): boolean {
    return this.isActive();
  }

  /**
   * Check if folder can be restored (must be deleted)
   */
  canBeRestored(): boolean {
    return this.isDeleted && this.deletedAt !== undefined;
  }

  /**
   * Get age of folder in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this folder could be a parent of another folder
   * (to prevent circular references - this should be checked at application layer)
   */
  couldBeParentOf(folderId: string): boolean {
    return this.id !== folderId && this.isActive();
  }
}

