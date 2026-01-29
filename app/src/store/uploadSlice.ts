import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TaskStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'DOWNLOADING'
  | 'PAUSED'
  | 'RESUMING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TransferType = 'UPLOAD' | 'DOWNLOAD';

export interface TransferTask {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: TaskStatus;
  type: TransferType;
  error?: string;
  folderId?: string | null;
  path?: string;
  uri?: string; // Local URI for upload, remote URL or target path for download
  mimeType?: string;
  startTime?: number;
  endTime?: number;
  retryCount: number;
  ociUploadId?: string;
  isMultipart?: boolean;
  completedChunks?: { partNumber: number; etag: string }[];
  storageKey?: string;
  parUrl?: string; // PAR URL for upload/download
}

// Keep UploadTask for backward compatibility
export type UploadTask = TransferTask;

interface TransferState {
  tasks: TransferTask[];
  isTransferring: boolean;
}

const initialState: TransferState = {
  tasks: [],
  isTransferring: false,
};

const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<TransferTask>) => {
      state.tasks.push(action.payload);
      state.isTransferring = true;
    },
    addTasks: (state, action: PayloadAction<TransferTask[]>) => {
      state.tasks.push(...action.payload);
      state.isTransferring = true;
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TransferTask> }>,
    ) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload.updates,
        };
      }

      // Update global isTransferring status
      state.isTransferring = state.tasks.some(
        t =>
          t.status === 'PENDING' ||
          t.status === 'UPLOADING' ||
          t.status === 'DOWNLOADING' ||
          t.status === 'RESUMING',
      );
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      state.isTransferring = state.tasks.some(
        t =>
          t.status === 'PENDING' ||
          t.status === 'UPLOADING' ||
          t.status === 'DOWNLOADING' ||
          t.status === 'RESUMING',
      );
    },
    clearCompleted: state => {
      state.tasks = state.tasks.filter(
        t =>
          t.status !== 'COMPLETED' &&
          t.status !== 'CANCELLED' &&
          t.status !== 'FAILED',
      );
      state.isTransferring = state.tasks.some(
        t =>
          t.status === 'PENDING' ||
          t.status === 'UPLOADING' ||
          t.status === 'DOWNLOADING' ||
          t.status === 'RESUMING',
      );
    },
    resetTransferState: state => {
      state.tasks = [];
      state.isTransferring = false;
    },
  },
});

export const {
  addTask,
  addTasks,
  updateTask,
  removeTask,
  clearCompleted,
  resetTransferState,
} = transferSlice.actions;

// Reducer export
export default transferSlice.reducer;
