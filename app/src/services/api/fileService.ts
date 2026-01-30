import apiClient from './apiClient';

export interface FileDTO {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  thumbnailUrl?: string;
  isDeleted?: boolean;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderDTO {
  id: string;
  name: string;
  parentId?: string;
  isDeleted?: boolean;
}

export interface StorageAnalyticsDTO {
  totalUsage: string;
  totalQuota: string;
  usagePercentage: number;
  breakdown: {
    images: string;
    videos: string;
    documents: string;
    audio: string;
    others: string;
  };
}

export interface ListResponse {
  folders: FolderDTO[];
  files: FileDTO[];
  breadcrumbs?: FolderDTO[];
}

const fileService = {
  createFolder: async (name: string, parentId?: string) => {
    const response = await apiClient.post('/folders', { name, parentId });
    return response.data?.data; // Adjusted for standard API response wrapper { success: true, data: ... }
  },

  listFolderContents: async (parentId?: string, limit = 20, offset = 0) => {
    const params: any = { limit, offset };
    if (parentId) params.parentId = parentId;

    // Logic to switch endpoint if needed, but currently folders endpoint handles children via parentId query
    const response = await apiClient.get('/folders', { params });
    return response.data?.data;
  },

  // Legacy simple upload removed in favor of standardized chunked flow

  initiateUpload: async (params: {
    fileName: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
    path?: string;
    tier?: string;
  }): Promise<{
    ociUploadId?: string;
    parUrl: string;
    storageKey: string;
    fileName: string;
    isMultipart: boolean;
  }> => {
    const response = await apiClient.post('/files/upload', params);
    const data = response.data?.data;
    // Backend returns an array for batch support; unwrap the first item
    return Array.isArray(data) ? data[0] : data;
  },

  uploadChunk: async (url: string, chunk: Blob | ArrayBuffer) => {
    // Note: Direct upload to OCI via PAR URL
    // We use standard fetch or a clean axios instance without interceptors for direct OCI upload
    return fetch(url, {
      method: 'PUT',
      body: chunk,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  },

  completeUpload: async (params: {
    storageKey: string;
    fileName: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
    tier?: string;
    ociUploadId?: string;
    parts?: { partNumber: number; etag: string }[];
  }) => {
    const response = await apiClient.post('/files/upload', params);
    const data = response.data?.data;
    return Array.isArray(data) ? data[0] : data;
  },

  generateLink: async (fileId: string) => {
    // Use the unified download endpoint
    const response = await apiClient.post('/files/download', { id: fileId });
    const data = response.data?.data;
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || !result.success) {
      throw new Error(result?.error || 'Failed to generate link');
    }
    return result;
  },

  deleteFile: async (fileId: string, permanent = false) => {
    const url = `/files/${fileId}${permanent ? '?permanent=true' : ''}`;
    const response = await apiClient.delete(url);
    return response.data;
  },

  restoreFile: async (fileId: string) => {
    const response = await apiClient.post(`/files/${fileId}/restore`);
    return response.data;
  },

  deleteFolder: async (folderId: string, permanent = false) => {
    const url = `/folders/${folderId}${permanent ? '?permanent=true' : ''}`;
    const response = await apiClient.delete(url);
    return response.data;
  },

  restoreFolder: async (folderId: string) => {
    const response = await apiClient.post(`/folders/${folderId}/restore`);
    return response.data;
  },

  listTrash: async () => {
    const response = await apiClient.get('/trash');
    return response.data?.data;
  },

  getStorageAnalytics: async (): Promise<StorageAnalyticsDTO> => {
    const response = await apiClient.get('/files/analytics');
    return response.data?.data;
  },

  shareFile: async (
    fileId: string,
    email?: string,
    permission: 'VIEW' | 'EDIT' = 'VIEW',
    expiresInSeconds?: number,
  ) => {
    const type = email ? 'INTERNAL' : 'PUBLIC_LINK';
    const response = await apiClient.post(`/files/${fileId}/share`, {
      type,
      email,
      permission,
      expiresInSeconds,
    });
    return response.data?.data;
  },

  shareFolder: async (
    folderId: string,
    email?: string,
    permission: 'VIEW' | 'EDIT' = 'VIEW',
    expiresInSeconds?: number,
  ) => {
    const type = email ? 'INTERNAL' : 'PUBLIC_LINK';
    const response = await apiClient.post(`/folders/${folderId}/share`, {
      type,
      email,
      permission,
      expiresInSeconds,
    });
    return response.data?.data;
  },

  revokeShare: async (shareId: string) => {
    const response = await apiClient.delete(`/files/shares/${shareId}`);
    return response.data;
  },

  listSharedWithMe: async () => {
    const response = await apiClient.get('/files/shared');
    return response.data?.data;
  },
  search: async (
    query: string,
    type: 'all' | 'folder' | 'file' | 'secret' = 'all',
  ) => {
    const response = await apiClient.get('/search', {
      params: { q: query, type },
    });
    return response.data?.data;
  },
  getMediaAlbums: async (type: 'image' | 'video' | 'document') => {
    const response = await apiClient.get('/files/albums', { params: { type } });
    return response.data?.data;
  },
};

export default fileService;
