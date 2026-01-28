import { useState, useEffect, useCallback, useRef } from 'react';
import { HomeUiState, SearchSuggestion } from '../types';
import { databaseService } from '../../../services/db/DatabaseService';
import { useAppSelector } from '../../../store/hooks';
import { syncService } from '../../../services/api/syncService';
import fileService from '../../../services/api/fileService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

export const useHomeViewModel = () => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const isInitialSyncDone = useRef(false);

  const [uiState, setUiState] = useState<HomeUiState>({
    isLoading: true,
    recentFiles: [],
    totalFiles: 0,
    totalFolders: 0,
    storageUsedPercentage: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [revealedFileId, setRevealedFileId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [shareEvent, setShareEvent] = useState<{ url: string } | null>(null);

  // Load data from Local SQLite
  const loadLocalData = useCallback(() => {
    const recentFiles = databaseService.getRecentFiles(20);
    const stats = databaseService.getStats();

    setUiState(prev => ({
      ...prev,
      recentFiles: recentFiles.map(f => ({
        ...f,
        thumbnailUrl: f.thumbnailUrl
          ? f.thumbnailUrl.startsWith('http')
            ? f.thumbnailUrl
            : `${API_URL.replace('/api', '')}${f.thumbnailUrl}`
          : undefined,
      })),
      totalFiles: stats.totalFiles,
      totalFolders: stats.totalFolders,
      storageUsedPercentage: calculateStoragePercentage(),
      isLoading: false,
    }));
  }, [user]);

  const calculateStoragePercentage = () => {
    // Backend provides storagePercentage (e.g., 12.5 for 12.5%)
    if (user?.storagePercentage !== undefined) {
      return user.storagePercentage / 100;
    }
    if (!user?.storageQuota || !user?.storageUsed) return 0;
    const quota = parseInt(user.storageQuota);
    const used = parseInt(user.storageUsed);
    if (isNaN(quota) || isNaN(used) || quota === 0) return 0;
    return used / quota;
  };

  // Sync logic
  const performSync = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const lastSyncStr = await AsyncStorage.getItem('lastSyncTimestamp');
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : undefined;

      // If no lastSync, it's a first run for this user session or fresh install
      const result = await syncService.sync(lastSync);

      // Batch insert into SQLite
      if (result.folders && result.folders.length > 0) {
        databaseService.upsertFolders(result.folders);
      }
      if (result.files && result.files.length > 0) {
        databaseService.upsertFiles(result.files);
      }

      // Save new timestamp
      if (result.lastSync) {
        await AsyncStorage.setItem(
          'lastSyncTimestamp',
          new Date(result.lastSync).getTime().toString(),
        );
      }

      // Refresh local UI
      loadLocalData();
    } catch (error) {
      console.error('Sync failed:', error);
      setUiState(prev => ({
        ...prev,
        error: 'Sync failed, working offline',
        isLoading: false,
      }));
    }
  }, [isAuthenticated, loadLocalData]);

  const loadDashboardData = useCallback(async () => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    loadLocalData(); // Show cached first
    await performSync(); // Then sync
  }, [loadLocalData, performSync]);

  useEffect(() => {
    if (isAuthenticated && !isInitialSyncDone.current) {
      isInitialSyncDone.current = true;
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData, isInitialSyncDone]);

  const search = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    const results = databaseService.search(query);
    setSearchResults(results);
  };

  const filterFiles = (filter: string) => {
    setSelectedFilter(filter);
    const recentFiles = databaseService.getRecentFiles(100);

    if (filter !== 'All') {
      const filtered = recentFiles.filter(f => {
        if (filter === 'Images') return f.mimeType?.startsWith('image/');
        if (filter === 'Videos') return f.mimeType?.startsWith('video/');
        if (filter === 'Docs')
          return f.mimeType?.includes('pdf') || f.mimeType?.includes('doc');
        return true;
      });
      setUiState(prev => ({ ...prev, recentFiles: filtered.slice(0, 20) }));
    } else {
      setUiState(prev => ({ ...prev, recentFiles: recentFiles.slice(0, 20) }));
    }
  };

  const downloadFile = (id: string) => {
    console.log('Downloading file', id);
  };

  const deleteFile = (id: string) => {
    console.log('Deleting file', id);
    // TODO: Implement soft delete in DB and sync with backend
  };

  const shareFile = async (id: string) => {
    try {
      // By default generate a public link
      const result = await fileService.shareFile(id);
      if (result && result.link) {
        // Construct full URL
        const fullUrl = `${API_URL.replace('/api', '')}${result.link}`;
        setShareEvent({ url: fullUrl });
      } else {
        // Fallback if no link returned
        setShareEvent({ url: `https://v8id.cloud/file/${id}` });
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback
      setShareEvent({ url: `https://v8id.cloud/file/${id}` });
    }
  };

  const clearShareEvent = () => setShareEvent(null);

  return {
    uiState,
    user: user || { firstName: 'Guest', avatarUrl: undefined },
    searchQuery,
    searchResults,
    search,
    selectedFilter,
    setFilter: filterFiles,
    revealedFileId,
    setRevealedFileId,
    showFilters,
    setShowFilters,
    downloadFile,
    deleteFile,
    shareFile,
    loadDashboardData,
    shareEvent,
    clearShareEvent,
  };
};
