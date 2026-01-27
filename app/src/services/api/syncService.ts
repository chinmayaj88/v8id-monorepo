import apiClient from './apiClient';

export interface SyncResult {
  files: any[];
  folders: any[];
  lastSync: string;
}

export const syncService = {
  sync: async (since?: number): Promise<SyncResult> => {
    const response = await apiClient.get<{ data: SyncResult }>(
      since ? `/sync?since=${since}` : '/sync',
    );
    return response.data.data;
  },
};
