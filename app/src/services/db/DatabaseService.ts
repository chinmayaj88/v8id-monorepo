import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import {
  FileItem,
  FolderData,
  SearchSuggestion,
} from '../../features/home/types';

const DB_NAME = 'v8id_cloud_v1.sqlite';

class DatabaseService {
  private db: QuickSQLiteConnection | null = null;

  constructor() {
    try {
      this.db = open({ name: DB_NAME });
      this.initSchema();
    } catch (e) {
      console.error('Failed to open database', e);
    }
  }

  private initSchema() {
    if (!this.db) return;

    this.db.execute(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        parentId TEXT,
        updatedAt INTEGER NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        color TEXT,
        userId TEXT,
        sharedWith TEXT
      );
    `);

    this.db.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        folderId TEXT,
        size INTEGER NOT NULL,
        mimeType TEXT NOT NULL,
        updatedAt INTEGER NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        thumbnailUrl TEXT,
        userId TEXT,
        linkUrl TEXT,
        linkExpiresAt INTEGER,
        tier TEXT,
        sharedWith TEXT
      );
    `);

    // Migrations for existing installs
    try {
      this.db.execute('ALTER TABLE files ADD COLUMN tier TEXT');
    } catch (e) {}
    try {
      this.db.execute('ALTER TABLE files ADD COLUMN sharedWith TEXT');
    } catch (e) {}
    try {
      this.db.execute('ALTER TABLE folders ADD COLUMN sharedWith TEXT');
    } catch (e) {}

    // Index for recent files
    this.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_files_updatedAt ON files(updatedAt DESC) WHERE isDeleted = 0;`,
    );
  }

  public async deleteSchema() {
    if (!this.db) return;
    this.db.execute('DROP TABLE IF EXISTS files');
    this.db.execute('DROP TABLE IF EXISTS folders');
    this.initSchema();
  }

  // --- Upsert Logic for Sync ---

  public upsertFolders(folders: any[]) {
    if (!this.db) return;
    this.db.transaction(tx => {
      folders.forEach(folder => {
        const sharedWith = folder.folderShares
          ? JSON.stringify(
              folder.folderShares.map((s: any) => ({
                name: s.sharedWith,
                avatarUrl: s.avatarUrl || null,
              })),
            )
          : null;

        tx.execute(
          `INSERT OR REPLACE INTO folders (id, name, parentId, updatedAt, isDeleted, color, userId, sharedWith) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            folder.id,
            folder.name,
            folder.parentId,
            new Date(folder.updatedAt).getTime(),
            folder.isDeleted ? 1 : 0,
            folder.color || null,
            folder.userId,
            sharedWith,
          ],
        );
      });
    });
  }

  public upsertFiles(files: any[]) {
    if (!this.db) return;
    this.db.transaction(tx => {
      files.forEach(file => {
        const sharedWith = file.fileShares
          ? JSON.stringify(
              file.fileShares.map((s: any) => ({
                name: s.sharedWith,
                avatarUrl: s.avatarUrl || null,
              })),
            )
          : null;

        tx.execute(
          `INSERT OR REPLACE INTO files (id, name, folderId, size, mimeType, updatedAt, isDeleted, thumbnailUrl, userId, tier, sharedWith) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            file.id,
            file.name,
            file.folderId,
            file.size,
            file.mimeType,
            new Date(file.updatedAt).getTime(),
            file.isDeleted ? 1 : 0,
            file.thumbnailKey || file.thumbnailUrl || null,
            file.userId,
            file.storageTier || null,
            sharedWith,
          ],
        );
      });
    });
  }

  public getStats() {
    if (!this.db) return { totalFiles: 0, totalFolders: 0 };
    const fileRes = this.db.execute(
      'SELECT COUNT(*) as count FROM files WHERE isDeleted = 0',
    );
    const folderRes = this.db.execute(
      'SELECT COUNT(*) as count FROM folders WHERE isDeleted = 0',
    );

    return {
      totalFiles: fileRes.rows?._array[0]?.count || 0,
      totalFolders: folderRes.rows?._array[0]?.count || 0,
    };
  }

  // --- Queries ---

  public getRecentFiles(limit: number = 20): any[] {
    if (!this.db) return [];

    const result = this.db.execute(
      `
        SELECT id, name, size, mimeType, updatedAt, thumbnailUrl, folderId, tier, sharedWith, 0 as isFolder FROM files 
        WHERE isDeleted = 0 
        UNION ALL
        SELECT id, name, 0 as size, 'folder' as mimeType, updatedAt, NULL as thumbnailUrl, parentId as folderId, NULL as tier, sharedWith, 1 as isFolder FROM folders
        WHERE isDeleted = 0
        ORDER BY updatedAt DESC 
        LIMIT ?
      `,
      [limit],
    );

    return (result.rows?._array || []).map(row => {
      if (row.isFolder) {
        return {
          id: row.id,
          name: row.name,
          size: 'Folder',
          timeAgo: this.formatTimeAgo(row.updatedAt),
          mimeType: 'folder',
          isFolder: true,
          icon: 'folder',
          sharedUsers: row.sharedWith ? JSON.parse(row.sharedWith) : undefined,
        };
      }
      return this.mapRowToFileItem(row);
    });
  }

  public updateFileLink(id: string, url: string, expiresAt: number) {
    if (!this.db) return;
    this.db.execute(
      'UPDATE files SET linkUrl = ?, linkExpiresAt = ? WHERE id = ?',
      [url, expiresAt, id],
    );
  }

  public getFileById(id: string): any | null {
    if (!this.db) return null;
    const res = this.db.execute('SELECT * FROM files WHERE id = ?', [id]);
    return res.rows?._array[0] || null;
  }

  public getFoldersByParentId(parentId: string | null): any[] {
    if (!this.db) return [];
    const query = parentId
      ? 'SELECT * FROM folders WHERE parentId = ? AND isDeleted = 0 ORDER BY name ASC'
      : 'SELECT * FROM folders WHERE parentId IS NULL AND isDeleted = 0 ORDER BY name ASC';
    const params = parentId ? [parentId] : [];

    const result = this.db.execute(query, params);
    return (result.rows?._array || []).map(row => ({
      id: row.id,
      name: row.name,
      timeAgo: this.formatTimeAgo(row.updatedAt),
      color: row.color,
      isFolder: true,
      icon: 'folder',
      sharedUsers: row.sharedWith ? JSON.parse(row.sharedWith) : undefined,
    }));
  }

  public getFilesByFolderId(folderId: string | null): FileItem[] {
    if (!this.db) return [];
    const query = folderId
      ? 'SELECT * FROM files WHERE folderId = ? AND isDeleted = 0 ORDER BY name ASC'
      : 'SELECT * FROM files WHERE folderId IS NULL AND isDeleted = 0 ORDER BY name ASC';
    const params = folderId ? [folderId] : [];

    const result = this.db.execute(query, params);
    return (result.rows?._array || []).map(this.mapRowToFileItem);
  }

  public deleteFile(id: string) {
    if (!this.db) return;
    this.db.execute('UPDATE files SET isDeleted = 1 WHERE id = ?', [id]);
  }

  public deleteFolder(id: string) {
    if (!this.db) return;
    this.db.execute('UPDATE folders SET isDeleted = 1 WHERE id = ?', [id]);
  }

  public search(query: string): SearchSuggestion[] {
    if (!this.db || !query) return [];

    const sanitized = `%${query}%`;

    // Search Files
    const files = this.db.execute(
      `
        SELECT id, name, size, mimeType FROM files 
        WHERE name LIKE ? AND isDeleted = 0
        LIMIT 5
    `,
      [sanitized],
    );

    // Search Folders
    const folders = this.db.execute(
      `
        SELECT id, name FROM folders 
        WHERE name LIKE ? AND isDeleted = 0
        LIMIT 3
    `,
      [sanitized],
    );

    const suggestions: SearchSuggestion[] = [];

    (files.rows?._array || []).forEach((row: any) => {
      suggestions.push({
        id: row.id,
        title: row.name,
        subtitle: this.formatSize(row.size),
        type: 'FILE',
        icon: this.getIconForMimeType(row.mimeType),
      });
    });

    (folders.rows?._array || []).forEach((row: any) => {
      suggestions.push({
        id: row.id,
        title: row.name,
        subtitle: 'Folder',
        type: 'FOLDER',
        icon: 'folder',
      });
    });

    return suggestions;
  }

  // --- Helpers ---

  private mapRowToFileItem = (row: any): FileItem => {
    return {
      id: row.id,
      name: row.name,
      size: this.formatSize(row.size),
      timeAgo: this.formatTimeAgo(row.updatedAt),
      mimeType: row.mimeType,
      thumbnailUrl: row.thumbnailUrl,
      folderId: row.folderId,
      rawSize: row.size,
      tier: row.tier,
      sharedUsers: row.sharedWith ? JSON.parse(row.sharedWith) : undefined,
    };
  };

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private getIconForMimeType(mime: string): string {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'movie';
    if (mime === 'application/pdf') return 'picture-as-pdf';
    return 'insert-drive-file';
  }
}

export const databaseService = new DatabaseService();
