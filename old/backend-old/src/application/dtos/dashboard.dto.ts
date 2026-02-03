import { FileResponseDTO, FolderResponseDTO } from './file.dto.js';

export interface DashboardResponseDTO {
  storage: {
    total: number;
    used: number;
    percentage: number;
  };
  recentFiles: FileResponseDTO[];
  folders: FolderResponseDTO[];
  stats: {
    totalFiles: number;
    totalFolders: number;
  };
}
