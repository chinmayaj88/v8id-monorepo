import apiClient from './apiClient';

export interface SyncResult {
  files: any[];
  folders: any[];
  lastSync: string;
}

export const syncService = {
  sync: async (since?: number): Promise<SyncResult> => {
    try {
      const response = await apiClient.get<any>(
        since ? `/sync?since=${since}` : '/sync',
      );

      // Handle standard successful response
      if (response.data?.success) {
        return response.data.data;
      }

      // Handle case where server might return 304 or empty success
      return {
        files: [],
        folders: [],
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Sync Service Error]:', error);
      throw error;
    }
  },
};
