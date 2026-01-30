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
      // Parallel fetch for standard sync (owned) and shared items (shared with me)
      const [syncRes, sharedRes] = await Promise.allSettled([
        apiClient.get<any>(since ? `/sync?since=${since}` : '/sync'),
        apiClient.get<any>('/files/shared'),
      ]);

      let syncData: SyncResult = {
        files: [],
        folders: [],
        lastSync: new Date().toISOString(),
      };

      // Process Sync Response
      if (syncRes.status === 'fulfilled' && syncRes.value.data?.success) {
        syncData = syncRes.value.data.data;
      } else if (syncRes.status === 'rejected') {
        console.error('[Sync Service] Sync failed:', syncRes.reason);
        // We continue to try processing shared items
      }

      // Process Shared Response
      let sharedFiles: any[] = [];
      let sharedFolders: any[] = [];

      if (sharedRes.status === 'fulfilled' && sharedRes.value.data?.success) {
        const data = sharedRes.value.data.data; // Expected { files: [], folders: [] }

        if (data?.files) {
          sharedFiles = data.files.map((s: any) => ({
            ...s.file,
            tier: s.file.tier,
            // Map 'sharedUsers' from DTO to 'fileShares' structure expected by DatabaseService
            fileShares: s.file.sharedUsers
              ? s.file.sharedUsers.map((u: any) => ({
                  sharedWith: u.name,
                  avatarUrl: u.avatarUrl,
                  id: u.shareId,
                }))
              : [],
          }));
        }

        if (data?.folders) {
          sharedFolders = data.folders.map((s: any) => ({
            ...s.folder,
            // Map 'sharedUsers' from DTO to 'folderShares' structure
            folderShares: s.folder.sharedUsers
              ? s.folder.sharedUsers.map((u: any) => ({
                  sharedWith: u.name,
                  avatarUrl: u.avatarUrl,
                  id: u.shareId,
                }))
              : [],
          }));
        }
      } else if (sharedRes.status === 'rejected') {
        console.error('[Sync Service] Shared fetch failed:', sharedRes.reason);
      }

      // Merge and Deduplicate (preferring sync data if conflict, though usually sets are disjoint)
      const allFiles = [...syncData.files, ...sharedFiles];
      const allFolders = [...syncData.folders, ...sharedFolders];

      const uniqueFiles = Array.from(
        new Map(allFiles.map(item => [item.id, item])).values(),
      );
      const uniqueFolders = Array.from(
        new Map(allFolders.map(item => [item.id, item])).values(),
      );

      return {
        files: uniqueFiles,
        folders: uniqueFolders,
        lastSync: syncData.lastSync,
        sharedFileIds: sharedFiles.map(f => f.id),
        sharedFolderIds: sharedFolders.map(f => f.id),
      };
    } catch (error) {
      console.error('[Sync Service Error]:', error);
      throw error;
    }
  },
};
