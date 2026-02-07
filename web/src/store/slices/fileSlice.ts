import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  mimeType: string;
  extension: string;
  updatedAt: string;
  lastAccessed?: string;
  starred: boolean;
  folderId: string | null;
  isShared: boolean;
  sharePermission?: string;
  sharedBy?: string;
  owner?: {
    firstName?: string;
    lastName?: string;
    email: string;
    avatarUrl?: string;
  };
  thumbnailUrl?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  updatedAt: string;
  isShared: boolean;
  sharePermission?: string;
  sharedBy?: string;
  fileCount?: number;
  owner?: {
    firstName?: string;
    lastName?: string;
    email: string;
    avatarUrl?: string;
  };
}

interface FileState {
  files: FileItem[];
  folders: FolderItem[];
  sharedFiles: FileItem[];
  sharedFolders: FolderItem[];
  sharedBreadcrumbs: FolderItem[];
  trashFiles: FileItem[];
  trashFolders: FolderItem[];
  searchQuery: string;
  currentFolderId: string | null;
  lastSync: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  folders: [],
  sharedFiles: [],
  sharedFolders: [],
  sharedBreadcrumbs: [],
  trashFiles: [],
  trashFolders: [],
  searchQuery: '',
  currentFolderId: null,
  lastSync: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchSyncData = createAsyncThunk<
  { files: FileItem[]; folders: FolderItem[]; lastSync: string },
  void,
  { rejectValue: string }
>('files/fetchSyncData', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/sync');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to sync data');
  }
});

export const fetchSharedData = createAsyncThunk<
  { files: FileItem[]; folders: FolderItem[] },
  void,
  { rejectValue: string }
>('files/fetchSharedData', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/files/shared');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch shared data');
  }
});

export const fetchSharedFolderContents = createAsyncThunk<
  { files: FileItem[]; folders: FolderItem[]; breadcrumbs: FolderItem[] },
  string,
  { rejectValue: string }
>('files/fetchSharedFolderContents', async (folderId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/folders', { params: { parentId: folderId } });
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch shared folder contents'
    );
  }
});

export const createFolder = createAsyncThunk<
  FolderItem,
  { name: string; parentId: string | null },
  { rejectValue: string }
>('files/createFolder', async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/folders', data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create folder');
  }
});

export const moveItems = createAsyncThunk<
  void,
  { fileIds: string[]; folderIds: string[]; targetFolderId: string | null },
  { rejectValue: string }
>('files/moveItems', async (data, { rejectWithValue, dispatch }) => {
  try {
    await apiClient.post('/files/move', data);
    dispatch(fetchSyncData());
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to move items');
  }
});

export const copyItems = createAsyncThunk<
  void,
  { fileIds: string[]; folderIds: string[]; targetFolderId: string | null },
  { rejectValue: string }
>('files/copyItems', async (data, { rejectWithValue, dispatch }) => {
  try {
    await apiClient.post('/files/copy', data);
    dispatch(fetchSyncData());
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to copy items');
  }
});

export const bulkDeleteItems = createAsyncThunk<
  void,
  { fileIds: string[]; folderIds: string[]; permanent?: boolean },
  { rejectValue: string }
>('files/bulkDeleteItems', async (data, { rejectWithValue, dispatch }) => {
  try {
    await apiClient.delete('/files', { data });
    dispatch(fetchSyncData());
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete items');
  }
});

export const uploadFiles = createAsyncThunk<
  FileItem[],
  {
    files: File[];
    folderId: string | null;
    paths?: string[];
    onProgress?: (percent: number) => void;
  },
  { rejectValue: string }
>(
  'files/uploadFiles',
  async ({ files, folderId, paths, onProgress }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      // Send metadata for folder support
      const metadata = files.map((file, index) => ({
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        folderId,
        path: paths ? paths[index] : undefined,
      }));

      formData.append('metadata', JSON.stringify(metadata));

      const response = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      dispatch(fetchSyncData());
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload files');
    }
  }
);

export const fetchTrashData = createAsyncThunk<
  { files: FileItem[]; folders: FolderItem[] },
  void,
  { rejectValue: string }
>('files/fetchTrashData', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/trash');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch trash data');
  }
});

export const restoreItems = createAsyncThunk<
  void,
  { fileIds: string[]; folderIds: string[] },
  { rejectValue: string }
>('files/restoreItems', async ({ fileIds, folderIds }, { rejectWithValue, dispatch }) => {
  try {
    const promises = [
      ...fileIds.map(id => apiClient.post(`/files/${id}/restore`)),
      ...folderIds.map(id => apiClient.post(`/folders/${id}/restore`)),
    ];
    await Promise.all(promises);
    dispatch(fetchTrashData());
    dispatch(fetchSyncData()); // Refresh main files too
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to restore items');
  }
});

export const permanentDeleteItems = createAsyncThunk<
  void,
  { fileIds: string[]; folderIds: string[] },
  { rejectValue: string }
>('files/permanentDeleteItems', async ({ fileIds, folderIds }, { rejectWithValue, dispatch }) => {
  try {
    const promises = [
      ...fileIds.map(id => apiClient.delete(`/files/${id}?permanent=true`)),
      ...folderIds.map(id => apiClient.delete(`/folders/${id}?permanent=true`)),
    ];
    await Promise.all(promises);
    dispatch(fetchTrashData());
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to permanently delete items');
  }
});

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setFiles: (state, action: PayloadAction<FileItem[]>) => {
      state.files = action.payload;
    },
    setFolders: (state, action: PayloadAction<FolderItem[]>) => {
      state.folders = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCurrentFolderId: (state, action: PayloadAction<string | null>) => {
      state.currentFolderId = action.payload;
    },
    clearFileData: state => {
      state.files = [];
      state.folders = [];
      state.sharedFiles = [];
      state.sharedFolders = [];
      state.sharedBreadcrumbs = [];
      state.trashFiles = [];
      state.trashFolders = [];
      state.searchQuery = '';
      ((state.currentFolderId = null), (state.lastSync = null));
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Sync Data
    builder.addCase(fetchSyncData.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSyncData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.files = action.payload.files || [];
      state.folders = action.payload.folders || [];
      state.lastSync = action.payload.lastSync;
    });
    builder.addCase(fetchSyncData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Shared Data
    builder.addCase(fetchSharedData.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSharedData.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload || { files: [], folders: [] };
      state.sharedFiles = (data.files || []).map((s: any) => ({
        ...(s.file || {}),
        shareId: s.id,
        permission: s.permission,
        sharedAt: s.sharedAt,
        owner: s.file?.sharedUsers?.[0]
          ? {
              firstName: s.file.sharedUsers[0].name.split(' ')[0],
              lastName: s.file.sharedUsers[0].name.split(' ')[1] || '',
              // avatarUrl: s.file.sharedUsers[0].avatarUrl,
              email: '',
            }
          : s.file?.owner,
      }));
      state.sharedFolders = (data.folders || []).map((s: any) => ({
        ...(s.folder || {}),
        shareId: s.id,
        permission: s.permission,
        sharedAt: s.sharedAt,
        owner: s.folder?.sharedUsers?.[0]
          ? {
              firstName: s.folder.sharedUsers[0].name.split(' ')[0],
              lastName: s.folder.sharedUsers[0].name.split(' ')[1] || '',
              // avatarUrl: s.folder.sharedUsers[0].avatarUrl,
              email: '',
            }
          : s.folder?.owner,
      }));
      state.sharedBreadcrumbs = [];
    });
    builder.addCase(fetchSharedData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Shared Folder Contents
    builder.addCase(fetchSharedFolderContents.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSharedFolderContents.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload || { files: [], folders: [], breadcrumbs: [] };

      const mapOwner = (item: any) => {
        if (item.owner) return item.owner;
        if (item.ownerName) {
          const parts = item.ownerName.split(' ');
          return {
            firstName: parts[0],
            lastName: parts.slice(1).join(' '),
            email: '',
            avatarUrl: null,
          };
        }
        return undefined;
      };

      state.sharedFiles = (data.files || []).map((f: any) => ({
        ...f,
        isShared: true,
        owner: mapOwner(f),
      }));
      state.sharedFolders = (data.folders || []).map((f: any) => ({
        ...f,
        isShared: true,
        owner: mapOwner(f),
      }));
      state.sharedBreadcrumbs = (data.breadcrumbs || []).map((b: any) => ({
        ...b,
        isShared: true,
      }));
    });
    builder.addCase(fetchSharedFolderContents.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Trash Data
    builder.addCase(fetchTrashData.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTrashData.fulfilled, (state, action) => {
      state.isLoading = false;
      const data = action.payload || { files: [], folders: [] };
      state.trashFiles = data.files || [];
      state.trashFolders = data.folders || [];
    });
    builder.addCase(fetchTrashData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Restore & Delete Actions
    builder.addCase(restoreItems.fulfilled, state => {
      state.isLoading = false;
      // Optimistic update could go here, but we refetch in thunk
    });
    builder.addCase(permanentDeleteItems.fulfilled, state => {
      state.isLoading = false;
    });

    builder.addCase(createFolder.fulfilled, (state, action) => {
      state.folders.push(action.payload);
    });

    // Logout
    builder.addCase('auth/logout', state => {
      state.files = [];
      state.folders = [];
      state.sharedFiles = [];
      state.sharedFolders = [];
      state.sharedBreadcrumbs = [];
      state.trashFiles = [];
      state.trashFolders = [];
      state.lastSync = null;
      state.error = null;
    });
  },
});

export const { setFiles, setFolders, setSearchQuery, setCurrentFolderId, clearFileData } =
  fileSlice.actions;
export default fileSlice.reducer;
