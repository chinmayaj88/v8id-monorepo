import apiClient from './apiClient';

export interface SyncResult {
  files: any[];
  folders: any[];
  lastSync: string;
  sharedFileIds?: string[];
  sharedFolderIds?: string[];
}

export const syncService = {
  sync: async (since?: number): Promise<SyncResult> => {
    try {
      // Standard sync only (owned items)
      const syncRes = await apiClient.get<any>(
        since ? `/sync?since=${since}` : '/sync',
      );

      let syncData: SyncResult = {
        files: [],
        folders: [],
        lastSync: new Date().toISOString(),
      };

      // Process Sync Response
      if (syncRes.data?.success) {
        syncData = syncRes.data.data;
      }

      return {
        files: syncData.files,
        folders: syncData.folders,
        lastSync: syncData.lastSync,
        sharedFileIds: [],
        sharedFolderIds: [],
      };
    } catch (error) {
      console.error('[Sync Service Error]:', error);
      throw error;
    }
  },
};
