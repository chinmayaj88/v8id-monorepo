import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UploadStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface UploadTask {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
  folderId?: string | null;
  path?: string;
  uri: string;
  type: string;
  startTime?: number;
  endTime?: number;
  retryCount: number;
}

interface UploadState {
  tasks: UploadTask[];
  isTransferring: boolean;
}

const initialState: UploadState = {
  tasks: [],
  isTransferring: false,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<UploadTask>) => {
      state.tasks.push(action.payload);
      state.isTransferring = true;
    },
    addTasks: (state, action: PayloadAction<UploadTask[]>) => {
      state.tasks.push(...action.payload);
      state.isTransferring = true;
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<UploadTask> }>,
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
        t => t.status === 'PENDING' || t.status === 'UPLOADING',
      );
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      state.isTransferring = state.tasks.some(
        t => t.status === 'PENDING' || t.status === 'UPLOADING',
      );
    },
    clearCompleted: state => {
      state.tasks = state.tasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
      );
    },
    resetUploadState: state => {
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
  resetUploadState,
} = uploadSlice.actions;

export default uploadSlice.reducer;
