export interface FileItem {
  id: string;
  name: string;
  size: string;
  rawSize?: number;
  timeAgo: string;
  thumbnailUrl?: string; // string URL
  mimeType?: string;
  folderId?: string;
  isFolder?: boolean;
  icon?: any; // Icon source or name
  tier?: 'Standard' | 'Archive' | string;
  sharedUsers?: Array<{
    id?: string;
    name?: string;
    avatarUrl?: string;
  }>;
}

export interface FolderData {
  id: string;
  name: string;
  size: string;
  icon: any; // Icon source
  iconColor: string;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'FILE' | 'FOLDER' | 'SECRET';
  icon?: any;
  mimeType?: string;
}

export interface HomeUiState {
  isLoading: boolean;
  error?: string;
  recentFiles: FileItem[];
  totalFiles: number;
  totalFolders: number;
  storageUsedPercentage: number;
}
