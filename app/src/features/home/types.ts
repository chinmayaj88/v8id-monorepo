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
  type: 'FILE' | 'FOLDER';
  icon?: any;
}

export interface HomeUiState {
  isLoading: boolean;
  error?: string;
  recentFiles: FileItem[];
  totalFiles: number;
  totalFolders: number;
  storageUsedPercentage: number;
}
