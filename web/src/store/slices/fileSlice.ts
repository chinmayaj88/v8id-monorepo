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
  searchQuery: string;
  lastSync: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  folders: [],
  searchQuery: '',
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
    clearFileData: state => {
      state.files = [];
      state.folders = [];
      state.searchQuery = '';
      state.lastSync = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchSyncData.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSyncData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.files = action.payload.files;
      state.folders = action.payload.folders;
      state.lastSync = action.payload.lastSync;
    });
    builder.addCase(fetchSyncData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    builder.addCase(createFolder.fulfilled, (state, action) => {
      state.folders.push(action.payload);
    });
    // Clear data on logout
    builder.addCase('auth/logout', state => {
      state.files = [];
      state.folders = [];
      state.lastSync = null;
      state.error = null;
    });
  },
});

export const { setFiles, setFolders, setSearchQuery, clearFileData } = fileSlice.actions;
export default fileSlice.reducer;
