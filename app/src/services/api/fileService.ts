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
  ) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileData.uri,
      type: fileData.type,
      name: fileData.name,
    } as any);

    if (folderId) formData.append('folderId', folderId);
    formData.append('tier', 'STANDARD'); // Default

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
};

export default fileService;
