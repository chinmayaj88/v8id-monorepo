export interface UnifiedSearchDTO {
  search: string;
  page?: number;
  limit?: number;
}

export type SearchResultType = 'file' | 'folder';

export interface SearchResultItemDTO {
  id: string;
  type: SearchResultType;
  name: string;
  description?: string;
  updatedAt: string;
  // Specific fields for files
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
  // Specific fields for folders
  color?: string;
  parentId?: string | null;
}

export interface UnifiedSearchResponseDTO {
  results: SearchResultItemDTO[];
  total: number;
}
