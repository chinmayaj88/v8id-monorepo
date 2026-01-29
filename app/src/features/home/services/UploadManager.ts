import { Platform } from 'react-native';
import fileService from '../../../services/api/fileService';
import { store } from '../../../store';
import {
  addTasks,
  updateTask,
  clearCompleted as clearReduxCompleted,
  UploadTask,
} from '../../../store/uploadSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRIES = 3;

interface FileData {
  uri: string;
  name: string;
  type: string;
  size: number;
}

class UploadManager {
  private activeUploads = 0;

  /**
   * Enqueue multiple files for upload
   */
  enqueue(files: FileData[], folderId?: string | null, path?: string) {
    const timestamp = Date.now();
    const newTasks = files.map((file, index) => ({
      id: `up-${timestamp}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'PENDING' as const,
      folderId,
      path,
      uri: file.uri,
      type: file.type,
      retryCount: 0,
    }));

    store.dispatch(addTasks(newTasks));
    this.processQueue();
  }

  /**
   * Process the queue based on concurrency limits
   */
  private processQueue() {
    const state = store.getState() as RootState;
    const { tasks } = state.upload;

    if (this.activeUploads >= MAX_CONCURRENT_UPLOADS) {
      return;
    }

    const nextTask = tasks.find(t => t.status === 'PENDING');
    if (!nextTask) {
      return;
    }

    this.activeUploads++;
    this.startUpload(nextTask.id).finally(() => {
      this.activeUploads--;
      this.processQueue();
    });

    // Strategy to fill remaining slots
    if (this.activeUploads < MAX_CONCURRENT_UPLOADS) {
      this.processQueue();
    }
  }

  /**
   * Handle the actual upload lifecycle for a specific task
   */
  private async startUpload(taskId: string) {
    const getTask = () =>
      (store.getState() as RootState).upload.tasks.find(t => t.id === taskId);
    let task = getTask();

    if (!task) return;

    store.dispatch(
      updateTask({
        id: taskId,
        updates: { status: 'UPLOADING', startTime: Date.now() },
      }),
    );

    try {
      // 1. Initiate Upload with Backend
      const initResult = await fileService.initiateUpload({
        fileName: task.name,
        mimeType: task.type || 'application/octet-stream',
        size: task.size,
        folderId: task.folderId,
        path: task.path,
      });

      const { parUrl, storageKey } = initResult;

      // 2. Direct Upload to Storage (Binary PUT)
      await this.performBinaryUpload(taskId, parUrl, task);

      // 3. Complete Upload with Backend
      await fileService.completeUpload({
        storageKey,
        fileName: task.name,
        mimeType: task.type || 'application/octet-stream',
        size: task.size,
        folderId: task.folderId,
      });

      store.dispatch(
        updateTask({
          id: taskId,
          updates: { status: 'COMPLETED', progress: 100, endTime: Date.now() },
        }),
      );
    } catch (error: any) {
      console.error(`[UploadManager] Task ${taskId} failed:`, error);

      task = getTask();
      if (task && task.retryCount < MAX_RETRIES) {
        // Retry logic
        const nextRetry = task.retryCount + 1;
        store.dispatch(
          updateTask({
            id: taskId,
            updates: { status: 'PENDING', retryCount: nextRetry },
          }),
        );
        console.log(
          `[UploadManager] Retrying task ${taskId} (${nextRetry}/${MAX_RETRIES})`,
        );
      } else {
        store.dispatch(
          updateTask({
            id: taskId,
            updates: {
              status: 'FAILED',
              error: error.message || 'Upload failed',
              endTime: Date.now(),
            },
          }),
        );
      }
    }
  }

  /**
   * Helper for the binary PUT request
   */
  private performBinaryUpload(
    taskId: string,
    url: string,
    task: UploadTask,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);

      const fileUri =
        Platform.OS === 'android' && !task.uri.includes('://')
          ? `file://${task.uri}`
          : task.uri;

      xhr.setRequestHeader(
        'Content-Type',
        task.type || 'application/octet-stream',
      );

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          store.dispatch(updateTask({ id: taskId, updates: { progress } }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage server returned status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));

      // Use React Native's native file streaming
      xhr.send({
        uri: fileUri,
        type: task.type || 'application/octet-stream',
        name: task.name,
      } as any);
    });
  }

  clearCompleted() {
    store.dispatch(clearReduxCompleted());
  }
}

export const uploadManager = new UploadManager();

/**
 * Enterprise hook for components to subscribe to upload status
 */
export const useUploadProgress = () => {
  const tasks = useSelector((state: RootState) => state.upload.tasks);
  const isTransferring = useSelector(
    (state: RootState) => state.upload.isTransferring,
  );

  return {
    tasks,
    isTransferring,
    activeTasks: tasks.filter(
      t => t.status === 'UPLOADING' || t.status === 'PENDING',
    ),
    clearCompleted: () => uploadManager.clearCompleted(),
  };
};
