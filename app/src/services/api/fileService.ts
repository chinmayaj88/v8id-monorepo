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

  uploadFile: async (
    fileData: any,
    folderId?: string,
    onProgress?: (progress: number) => void,
    path?: string,
  ) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileData.uri,
      type: fileData.type,
      name: fileData.name,
    } as any);

    if (folderId) formData.append('folderId', folderId);
    if (path) formData.append('path', path);
    formData.append('tier', 'STANDARD');

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data?.data;
  },

  initiateUpload: async (params: {
    fileName: string;
    mimeType: string;
    size: number;
    folderId?: string | null;
    path?: string;
    tier?: string;
  }) => {
    const response = await apiClient.post('/files/upload/initiate', params);
    return response.data?.data;
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
  }) => {
    const response = await apiClient.post('/files/upload/complete', params);
    return response.data?.data;
  },

  generateLink: async (fileId: string) => {
    const response = await apiClient.post(`/files/${fileId}/link`);
    return response.data?.data;
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

  listSharedWithMe: async () => {
    const response = await apiClient.get('/files/shared');
    return response.data?.data;
  },
};

export default fileService;
