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
  mimeType: string;
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
      type: 'UPLOAD' as const,
      folderId,
      path,
      uri: file.uri,
      mimeType: file.mimeType,
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
    const { tasks } = (state as any).transfer;

    if (this.activeUploads >= MAX_CONCURRENT_UPLOADS) {
      return;
    }

    const nextTask = tasks.find(
      (t: any) => t.status === 'PENDING' || t.status === 'RESUMING',
    );
    if (!nextTask || nextTask.type !== 'UPLOAD') {
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
      (store.getState() as any).transfer.tasks.find(
        (t: any) => t.id === taskId,
      );
    let task = getTask();

    if (!task || task.status === 'PAUSED') return;

    store.dispatch(
      updateTask({
        id: taskId,
        updates: {
          status: 'UPLOADING',
          startTime: task.startTime || Date.now(),
        },
      }),
    );

    try {
      // 1. Initiate Upload with Backend (Skip if resuming an existing session)
      let ociUploadId = task.ociUploadId;
      let parUrl = task.parUrl;
      let storageKey = task.storageKey;
      let isMultipart = task.isMultipart;

      console.log('UploadManager: Starting task', task);

      if (!parUrl) {
        const safeName = task.name || `unknown_file_${Date.now()}`;
        console.log('UploadManager: Initiating upload with name:', safeName);

        const initResult = await fileService.initiateUpload({
          fileName: safeName,
          mimeType: task.mimeType || 'application/octet-stream',
          size: task.size,
          folderId: task.folderId,
          path: task.path,
        });

        ociUploadId = initResult.ociUploadId;
        parUrl = initResult.parUrl;
        storageKey = initResult.storageKey;
        isMultipart = initResult.isMultipart;

        store.dispatch(
          updateTask({
            id: taskId,
            updates: {
              ociUploadId,
              parUrl,
              storageKey,
              isMultipart,
              name: initResult.fileName,
            },
          }),
        );
      }

      // 2. Perform Upload
      if (isMultipart && ociUploadId) {
        // Optimized Chunked Upload for Pause/Resume
        await this.performChunkedUpload(taskId, parUrl!, ociUploadId, task);
      } else {
        // Standard Binary PUT (Fast for small files)
        await this.performBinaryUpload(taskId, parUrl!, task);
      }

      // 3. Complete Upload with Backend
      task = getTask();
      if (!task || task.status === 'COMPLETED') return;

      await fileService.completeUpload({
        storageKey: storageKey!,
        fileName: task.name,
        mimeType: task.mimeType || 'application/octet-stream',
        size: task.size,
        folderId: task.folderId,
        ociUploadId,
        parts: task.completedChunks,
      });

      store.dispatch(
        updateTask({
          id: taskId,
          updates: { status: 'COMPLETED', progress: 100, endTime: Date.now() },
        }),
      );
    } catch (error: any) {
      // Handle Pause gracefully (not an error)
      if (error.message === 'PAUSED') {
        return;
      }

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

  private activeXHRs: Map<string, XMLHttpRequest> = new Map();

  /**
   * Pause an active upload
   */
  pauseTask(taskId: string) {
    const xhr = this.activeXHRs.get(taskId);
    if (xhr) {
      xhr.abort();
      this.activeXHRs.delete(taskId);
    }
    store.dispatch(
      updateTask({
        id: taskId,
        updates: { status: 'PAUSED' },
      }),
    );
  }

  /**
   * Stop/Cancel an upload completely
   */
  stopTask(taskId: string) {
    const xhr = this.activeXHRs.get(taskId);
    if (xhr) {
      xhr.abort();
      this.activeXHRs.delete(taskId);
    }
    store.dispatch(
      updateTask({
        id: taskId,
        updates: { status: 'CANCELLED' },
      }),
    );
  }

  /**
   * Resume a paused upload
   */
  resumeTask(taskId: string) {
    store.dispatch(
      updateTask({
        id: taskId,
        updates: { status: 'RESUMING' },
      }),
    );
    this.processQueue();
  }

  /**
   * Optimized Chunked Upload Logic
   */
  private async performChunkedUpload(
    taskId: string,
    parUrl: string,
    ociUploadId: string,
    initialTask: UploadTask,
  ) {
    const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB to be safely above OCI 5MiB minimum

    // Get file blob/slice. If this fails (e.g. content:// URI issues), fallback to simple binary upload.
    if (!initialTask.uri) throw new Error('File URI missing');

    let blob: Blob;
    try {
      blob = await this.getFileBlob(initialTask.uri);
    } catch (e) {
      console.warn(
        'Chunked upload: Failed to get Blob, falling back to single stream upload',
        e,
      );
      await this.performBinaryUpload(taskId, parUrl, initialTask);
      return;
    }

    const totalChunks = Math.ceil(initialTask.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      // 1. Check if paused
      const task = (store.getState() as any).transfer.tasks.find(
        (t: any) => t.id === taskId,
      );
      if (!task || task.status === 'PAUSED') {
        throw new Error('PAUSED');
      }

      // 2. Check if chunk already completed (Resume support)
      const partNumber = i + 1;
      const isDone = task.completedChunks?.some(
        (c: any) => c.partNumber === partNumber,
      );
      if (isDone) continue;

      // 3. Slice and Upload Chunk
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, initialTask.size);
      const chunkBlob = blob.slice(start, end);

      const etag = await this.uploadChunk(
        taskId,
        parUrl,
        ociUploadId,
        partNumber,
        chunkBlob,
      );

      // 4. Update Progress and State (Ensuring uniqueness)
      const existingChunks = task.completedChunks || [];
      const isAlreadyAdded = existingChunks.some(
        (c: any) => c.partNumber === partNumber,
      );

      const completedChunks = isAlreadyAdded
        ? existingChunks
        : [...existingChunks, { partNumber, etag }];

      // Cap at 99% during the loop; final 100% happens after backend "Complete"
      const rawProgress = Math.round(
        (completedChunks.length / totalChunks) * 100,
      );
      const progress = Math.min(rawProgress, 99);

      store.dispatch(
        updateTask({
          id: taskId,
          updates: { completedChunks, progress },
        }),
      );
    }
  }

  /**
   * Upload individual part directly to OCI using PAR
   */
  private uploadChunk(
    taskId: string,
    baseUrl: string,
    uploadId: string,
    partNumber: number,
    blob: Blob,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `${baseUrl}${
        baseUrl.includes('?') ? '&' : '?'
      }uploadId=${uploadId}&partNumber=${partNumber}`;
      const xhr = new XMLHttpRequest();
      this.activeXHRs.set(taskId, xhr);
      xhr.open('PUT', url);

      // OCI strictly requires Content-Type for parts
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.onload = () => {
        this.activeXHRs.delete(taskId);
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/\"/g, '') || '';
          resolve(etag);
        } else {
          reject(new Error(`Part upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => {
        this.activeXHRs.delete(taskId);
        reject(new Error('Network error'));
      };
      xhr.onabort = () => {
        this.activeXHRs.delete(taskId);
        reject(new Error('PAUSED'));
      };
      xhr.send(blob);
    });
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
        Platform.OS === 'android' && task.uri && !task.uri.includes('://')
          ? `file://${task.uri}`
          : task.uri || '';

      xhr.setRequestHeader(
        'Content-Type',
        task.mimeType || 'application/octet-stream',
      );

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const rawProgress = Math.round((event.loaded / event.total) * 100);
          // Clamp between 0 and 99. Handle negative overflow from native side.
          const progress = Math.max(0, Math.min(rawProgress, 99));
          store.dispatch(updateTask({ id: taskId, updates: { progress } }));
        }
      };

      xhr.onload = () => {
        this.activeXHRs.delete(taskId);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage server returned status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        this.activeXHRs.delete(taskId);
        reject(new Error('Network request failed'));
      };
      xhr.onabort = () => {
        this.activeXHRs.delete(taskId);
        reject(new Error('PAUSED'));
      };
      xhr.ontimeout = () => {
        this.activeXHRs.delete(taskId);
        reject(new Error('Upload timed out'));
      };

      // Use React Native's native file streaming
      xhr.send({
        uri: fileUri,
        type: task.type || 'application/octet-stream',
        name: task.name,
      } as any);
    });
  }

  /**
   * Helper to retrieve Blob from URI using XHR (Reliable for content:// URIs)
   */
  private getFileBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri);
      xhr.responseType = 'blob'; // React Native returns a Blob reference, not full memory load
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to load file blob: ${xhr.status}`));
        }
      };
      xhr.onerror = () =>
        reject(new Error('Failed to read file for processing'));
      xhr.send();
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
  const tasks = useSelector((state: any) => state.transfer.tasks);
  const isTransferring = useSelector(
    (state: any) => state.transfer.isTransferring,
  );

  return {
    tasks,
    isTransferring,
    activeTasks: tasks.filter(
      (t: any) =>
        t.status === 'UPLOADING' ||
        t.status === 'DOWNLOADING' ||
        t.status === 'PENDING' ||
        t.status === 'PAUSED' ||
        t.status === 'RESUMING',
    ),
    clearCompleted: () => uploadManager.clearCompleted(),
    pauseTask: (id: string) => uploadManager.pauseTask(id),
    resumeTask: (id: string) => uploadManager.resumeTask(id),
    stopTask: (id: string) => uploadManager.stopTask(id),
  };
};
