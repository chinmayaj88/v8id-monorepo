import { useState, useEffect, useCallback } from 'react';
import { HomeUiState, FileItem, SearchSuggestion } from '../types';
import { databaseService } from '../../../services/db/DatabaseService';

export const useHomeViewModel = () => {
  const [uiState, setUiState] = useState<HomeUiState>({
    isLoading: true,
    recentFiles: [],
    totalFiles: 0,
    totalFolders: 0,
    storageUsedPercentage: 0,
  });

  // User info mock (still mock until Auth is connected to DB/Pref)
  const user = {
    firstName: 'Chinmay',
    lastName: '',
    email: 'chinmay@v8id.com',
    avatarUrl: undefined,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [revealedFileId, setRevealedFileId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Download/Share events
  const [downloadEvent, setDownloadEvent] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [shareEvent, setShareEvent] = useState<{ url: string } | null>(null);

  const loadDashboardData = useCallback(async () => {
    setUiState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Seed data for testing (only inserts if empty)
      await databaseService.seedTestData();

      // Fetch recent files from DB
      const recentFiles = databaseService.getRecentFiles(20);

      setUiState({
        isLoading: false,
        recentFiles: recentFiles,
        totalFiles: 1240, // TODO: Get count from DB
        totalFolders: 45, // TODO: Get count from DB
        storageUsedPercentage: 0.72,
      });
    } catch (error) {
      console.error(error);
      setUiState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
    // Reload with filter from DB
    // For now, we just reload recent (Implement DB filter later if needed)
    // ideally: databaseService.getFilesByFilter(filter)
    const recentFiles = databaseService.getRecentFiles(20);

    if (filter !== 'All') {
      const filtered = recentFiles.filter(f => {
        if (filter === 'Images') return f.mimeType?.startsWith('image/');
        if (filter === 'Videos') return f.mimeType?.startsWith('video/');
        if (filter === 'Docs')
          return f.mimeType?.includes('pdf') || f.mimeType?.includes('doc');
        return true;
      });
      setUiState(prev => ({ ...prev, recentFiles: filtered }));
    } else {
      setUiState(prev => ({ ...prev, recentFiles: recentFiles }));
    }
  };

  const downloadFile = (id: string) => {
    console.log('Downloading file', id);
    // Trigger generic download
  };

  const deleteFile = (id: string) => {
    console.log('Deleting file', id);
    // databaseService.deleteFile(id);
    const recentFiles = databaseService.getRecentFiles(20); // Refresh
    setUiState(prev => ({ ...prev, recentFiles }));
  };

  const shareFile = (id: string) => {
    setShareEvent({ url: `https://v8id.cloud/file/${id}` });
  };

  const clearShareEvent = () => setShareEvent(null);

  return {
    uiState,
    user,
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
