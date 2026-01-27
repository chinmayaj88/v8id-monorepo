import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../theme/colors';
import { useHomeViewModel } from '../hooks/useHomeViewModel';
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

const HomeScreen = () => {
  const navigation = useNavigation();
  const viewModel = useHomeViewModel();

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

  // Handle Share Event
  useEffect(() => {
    if (shareEvent) {
      Share.share({
        message: `Check out this file from V8id Cloud: ${shareEvent.url}`,
      });
      clearShareEvent();
    }
  }, [shareEvent]);

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
          onFilterClick={() => setShowFilters(!showFilters)}
          onSuggestionClick={suggestion => {
            if (suggestion.type === 'FOLDER') {
              // @ts-ignore
              navigation.navigate('Folders', {
                folderId: suggestion.id,
                folderName: suggestion.title,
              });
            } else {
              // @ts-ignore
              navigation.navigate('Viewer', {
                fileId: suggestion.id,
                fileName: suggestion.title,
                fileType: '*/*',
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
          if (option === 'Folders') {
            // @ts-ignore
            navigation.navigate('Folders');
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

      <ViewedLinksCard onSeeAllClick={() => {}} />

      <Text style={styles.sectionTitle}>Recent Activity</Text>
    </View>
  );

  const renderItem = ({ item }: { item: FileItem }) => (
    <FileItemCard
      file={item}
      isRevealed={revealedFileId === item.id}
      onExpand={() => setRevealedFileId(item.id)}
      onCollapse={() => {
        if (revealedFileId === item.id) setRevealedFileId(null);
      }}
      onDownload={() => downloadFile(item.id)}
      onDelete={() => deleteFile(item.id)}
      onShare={() => shareFile(item.id)}
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
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={uiState.isLoading}
            onRefresh={loadDashboardData}
            colors={[Colors.purple.vibrant]}
          />
        }
      />
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
    fontWeight: 'bold',
    color: Colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
});

export default HomeScreen;
