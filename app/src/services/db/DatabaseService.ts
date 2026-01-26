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
        color TEXT
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
        FOREIGN KEY(folderId) REFERENCES folders(id)
      );
    `);
  }

  // --- Seeding for Test ---
  public async seedTestData() {
    if (!this.db) return;

    // Check if empty
    const result = this.db.execute('SELECT COUNT(*) as count FROM files');
    if (result.rows?._array[0].count > 0) return; // Already seeded

    console.log('Seeding test data...');

    const now = Date.now();

    // Folders
    this.db.execute(
      'INSERT INTO folders (id, name, parentId, updatedAt) VALUES (?, ?, ?, ?)',
      ['f1', 'Design Assets', null, now],
    );
    this.db.execute(
      'INSERT INTO folders (id, name, parentId, updatedAt) VALUES (?, ?, ?, ?)',
      ['f2', 'Project Alpha', null, now],
    );

    // Files
    const files = [
      [
        '1',
        'Design_System_v2.fig',
        null,
        '12000000',
        'image/figma',
        now - 10000,
      ],
      ['2', 'Q4_Report.pdf', 'f2', '2400000', 'application/pdf', now - 50000],
      ['3', 'Team_Meeting.mp4', null, '450000000', 'video/mp4', now - 100000],
      ['4', 'Logo.png', 'f1', '500000', 'image/png', now - 2000],
    ];

    files.forEach(f => {
      this.db?.execute(
        'INSERT INTO files (id, name, folderId, size, mimeType, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, 0)',
        f,
      );
    });
  }

  // --- Queries ---

  public getRecentFiles(limit: number = 20): FileItem[] {
    if (!this.db) return [];

    const result = this.db.execute(
      `
        SELECT * FROM files 
        WHERE isDeleted = 0 
        ORDER BY updatedAt DESC 
        LIMIT ?
    `,
      [limit],
    );

    return (result.rows?._array || []).map(this.mapRowToFileItem);
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
