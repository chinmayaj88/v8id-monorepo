import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Share,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography } from '../../../theme';
import { useHomeViewModel } from '../hooks/useHomeViewModel';
import { useAppDispatch } from '../../../store/hooks';
import { setCurrentFolderId } from '../../../store/uiSlice';
import {
  ProfileHeader,
  GradientHeading,
  QuickAccessCard,
  FileSummaryChip,
  ViewedLinksCard,
  FilterChip,
} from '../components/HomeComponents';
import { SearchBar } from '../components/SearchBar';
import { FileItemCard } from '../components/FileItemCard';
import { FileItem } from '../types';
import ShareModal from '../components/ShareModal';
import UploadProgressModal from '../components/UploadProgressModal';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AppModal from '../../../components/AppModal';

const HomeScreen = () => {
  const navigation = useNavigation();
  const viewModel = useHomeViewModel();
  const dispatch = useAppDispatch();

  const {
    uiState,
    user,
    searchQuery,
    searchResults,
    search,
    selectedFilter,
    setFilter,
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
  } = viewModel;

  // Sharing State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [itemToShare, setItemToShare] = useState<any>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    description?: string;
    variant?: 'default' | 'danger' | 'success';
    icon?: string;
    actions: { text: string; onPress: () => void; variant?: any }[];
  }>({
    visible: false,
    title: '',
    actions: [],
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const handleDelete = (item: FileItem) => {
    setModalConfig({
      visible: true,
      title: 'Delete Item',
      description: `Are you sure you want to delete "${item.name}"?`,
      variant: 'danger',
      icon: 'delete',
      actions: [
        {
          text: 'Cancel',
          onPress: closeModal,
          variant: 'secondary',
        },
        {
          text: 'Delete',
          variant: 'danger',
          onPress: async () => {
            closeModal();
            const success = await deleteFile(item.id);
            if (!success) {
              setTimeout(() => {
                setModalConfig({
                  visible: true,
                  title: 'Error',
                  description: 'Failed to delete item',
                  variant: 'danger',
                  actions: [{ text: 'OK', onPress: closeModal }],
                });
              }, 300);
            }
          },
        },
      ],
    });
  };

  // Handle Share Event
  useEffect(() => {
    if (shareEvent) {
      Share.share({
        message: `Check out this file from V8id Cloud: ${shareEvent.url}`,
      });
      clearShareEvent();
    }
  }, [shareEvent]);

  useFocusEffect(
    useCallback(() => {
      dispatch(setCurrentFolderId(null));
    }, [dispatch]),
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <ProfileHeader
        userName={user.firstName || 'User'}
        storagePercentage={uiState.storageUsedPercentage}
        profileImageUrl={user.avatarUrl}
        onProfileClick={() => {}}
        onNotificationClick={() => {
          // @ts-ignore
          navigation.navigate('Notifications');
        }}
      />

      <GradientHeading />

      <View style={styles.searchContainer}>
        <SearchBar
          searchQuery={searchQuery}
          onQueryChange={search}
          searchResults={searchResults}
          placeholder="Search files"
          onFilterClick={() => setShowFilters(!showFilters)}
          onSuggestionClick={suggestion => {
            if (suggestion.type === 'FOLDER') {
              // @ts-ignore
              navigation.navigate('Files', {
                folderId: suggestion.id,
                folderName: suggestion.title,
              });
            } else if (suggestion.type === 'SECRET') {
              // @ts-ignore
              navigation.navigate('Vault', {
                secretId: suggestion.id,
              });
            } else {
              // @ts-ignore
              navigation.navigate('Viewer', {
                fileId: suggestion.id,
                fileName: suggestion.title,
                fileType: suggestion.mimeType || '*/*',
              });
            }
          }}
        />

        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            {['All', 'Images', 'Videos', 'Docs'].map(f => (
              <FilterChip
                key={f}
                label={f}
                selected={selectedFilter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <QuickAccessCard
        onOptionClick={option => {
          if (option === 'Files') {
            // @ts-ignore
            navigation.navigate('Files');
          } else {
            setFilter(option);
          }
        }}
      />

      <View style={styles.summaryContainer}>
        <FileSummaryChip
          fileCount={uiState.totalFiles}
          folderCount={uiState.totalFolders}
        />
      </View>

      <ViewedLinksCard
        onSeeAllClick={() => {
          // @ts-ignore
          navigation.navigate('Shared');
        }}
      />

      <Text style={styles.sectionTitle}>Recent Activity</Text>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: FileItem }) => (
      <FileItemCard
        file={item}
        isRevealed={revealedFileId === item.id}
        onExpand={() => setRevealedFileId(item.id)}
        onCollapse={() => {
          if (revealedFileId === item.id) setRevealedFileId(null);
        }}
        onDownload={() => downloadFile(item.id)}
        onDelete={() => handleDelete(item)}
        onShare={() => {
          setItemToShare(item);
          setShareModalVisible(true);
        }}
        onClick={() => {
          if (item.isFolder) {
            // @ts-ignore
            navigation.navigate('Files', {
              folderId: item.id,
              folderName: item.name,
            });
          } else {
            // @ts-ignore
            navigation.navigate('Viewer', {
              fileId: item.id,
              fileName: item.name,
              fileType: item.mimeType || '*/*',
            });
          }
        }}
      />
    ),
    [revealedFileId, navigation, downloadFile, deleteFile, shareFile],
  );

  if (uiState.isLoading && uiState.recentFiles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.purple.vibrant} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={uiState.recentFiles}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={uiState.isLoading}
            onRefresh={loadDashboardData}
            colors={[Colors.purple.vibrant]}
          />
        }
      />
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        item={itemToShare}
      />
      <AppModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        icon={modalConfig.icon}
        actions={modalConfig.actions}
      />
      <UploadProgressModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  headerContent: {
    marginBottom: 16,
    marginTop: 20,
  },
  searchContainer: {
    zIndex: 100,
    marginVertical: 12,
  },
  filterRow: {
    marginTop: 8,
  },
  summaryContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
});

export default HomeScreen;
