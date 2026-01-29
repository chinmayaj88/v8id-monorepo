import { store } from '../../../store';
import fileService from '../../../services/api/fileService';
import { addTask, updateTask, TransferTask } from '../../../store/uploadSlice';

class DownloadManager {
  private activeDownloads: Map<string, AbortController> = new Map();

  /**
   * Start or resume a download
   */
  async startDownload(
    fileId: string,
    fileName: string,
    totalSize: number,
    mimeType?: string,
  ) {
    const taskId = `dl-${fileId}`;

    // Check if task already exists
    const state = store.getState() as any;
    let task = state.transfer.tasks.find((t: any) => t.id === taskId);

    if (!task) {
      task = {
        id: taskId,
        name: fileName,
        size: totalSize,
        progress: 0,
        status: 'PENDING',
        type: 'DOWNLOAD',
        retryCount: 0,
        mimeType,
      };
      store.dispatch(addTask(task));
    } else if (task.status === 'COMPLETED') {
      return;
    }

    store.dispatch(
      updateTask({ id: taskId, updates: { status: 'DOWNLOADING' } }),
    );

    const controller = new AbortController();
    this.activeDownloads.set(taskId, controller);

    try {
      // 1. Get PAR URL from backend
      const { parUrl } = await fileService.generateLink(fileId);

      // 2. Fetch with Range support
      // Note: In a real mobile app, we would use react-native-blob-util to stream to disk.
      // For this demo/testing, we'll simulate the download logic.
      const receivedBytes = task.receivedBytes || 0;

      const response = await fetch(parUrl, {
        headers: {
          Range: `bytes=${receivedBytes}-`,
        },
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Simulation of progress (since standard fetch doesn't easily show progress in RN)
      let currentProgress = task.progress || 0;
      const interval = setInterval(() => {
        const currentTask = (store.getState() as any).transfer.tasks.find(
          (t: any) => t.id === taskId,
        );
        if (!currentTask || currentTask.status !== 'DOWNLOADING') {
          clearInterval(interval);
          return;
        }

        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          store.dispatch(
            updateTask({
              id: taskId,
              updates: {
                status: 'COMPLETED',
                progress: 100,
                endTime: Date.now(),
              },
            }),
          );
          this.activeDownloads.delete(taskId);
        } else {
          store.dispatch(
            updateTask({
              id: taskId,
              updates: { progress: Math.min(currentProgress, 99) },
            }),
          );
        }
      }, 500);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        store.dispatch(
          updateTask({ id: taskId, updates: { status: 'PAUSED' } }),
        );
      } else {
        console.error(`[DownloadManager] Task ${taskId} failed:`, error);
        store.dispatch(
          updateTask({
            id: taskId,
            updates: { status: 'FAILED', error: error.message },
          }),
        );
      }
    } finally {
      this.activeDownloads.delete(taskId);
    }
  }

  pauseDownload(taskId: string) {
    const controller = this.activeDownloads.get(taskId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(taskId);
    }
  }

  resumeDownload(taskId: string) {
    const state = store.getState() as any;
    const task = state.transfer.tasks.find((t: any) => t.id === taskId);
    if (task) {
      this.startDownload(
        taskId.replace('dl-', ''),
        task.name,
        task.size,
        task.mimeType,
      );
    }
  }
}

export const downloadManager = new DownloadManager();
