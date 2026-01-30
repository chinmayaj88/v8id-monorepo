import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../theme';
import fileService from '../../../services/api/fileService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FileItemCard } from '../components/FileItemCard';
import { SearchBar } from '../components/SearchBar';
import AppModal from '../../../components/AppModal';
import ShareModal from '../components/ShareModal';
import UploadProgressModal from '../components/UploadProgressModal';
import { useAppDispatch } from '../../../store/hooks';
import { setCurrentFolderId } from '../../../store/uiSlice';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadManager } from '../services/UploadManager';
import { downloadManager } from '../services/DownloadManager';

type SubTab = 'FOLDERS' | 'FILES';

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileScreen = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const parentId = route.params?.folderId || null;
  const initialFolderName = route.params?.folderName || 'Cloud Drive';
  const filterType = route.params?.filterType; // 'image', 'video', 'document'
  const initialViewMode = route.params?.viewMode || 'LIST';

  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<SubTab>('FOLDERS');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedFileId, setRevealedFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>(
    initialViewMode as 'LIST' | 'GRID',
  );

  // Sharing State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const dispatch = useAppDispatch();
  const [itemToShare, setItemToShare] = useState<any>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const showModal = (config: Partial<typeof modalConfig>) => {
    setModalConfig({
      visible: true,
      title: config.title || '',
      description: config.description,
      variant: config.variant || 'default',
      icon: config.icon,
      actions: config.actions || [{ text: 'OK', onPress: () => closeModal() }],
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const isRoot = parentId === null;

  const loadContents = useCallback(async () => {
    setIsLoading(true);

    try {
      const parentIdArg = isRoot ? undefined : parentId;
      // Bump limit for gallery
      const data = await fileService.listFolderContents(parentIdArg, 1000);

      // Map API response to UI items
      const folderItems = (data.folders || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: '',
        timeAgo: new Date(f.updatedAt).toLocaleDateString(),
        isFolder: true,
        color: f.color,
        sharedUsers: f.sharedUsers,
      }));

      const fileItems = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: formatSize(Number(f.size)),
        timeAgo: new Date(f.updatedAt).toLocaleDateString(),
        mimeType: f.mimeType,
        thumbnailUrl: f.thumbnailUrl,
        folderId: f.folderId,
        isFolder: false,
        sharedUsers: f.sharedUsers,
      }));

      let combinedItems = [];

      // If filtering (Gallery Mode), ignore Tabs and take everything (we filter later)
      if (filterType) {
        combinedItems = [...folderItems, ...fileItems];
      } else if (isRoot) {
        if (activeTab === 'FOLDERS') {
          combinedItems = folderItems;
        } else {
          combinedItems = fileItems;
        }
      } else {
        combinedItems = [...folderItems, ...fileItems];
      }

      if (filterType) {
        // Filter for specific media types and hide folders
        combinedItems = combinedItems.filter(item => {
          if (item.isFolder) return false;
          // Case insensitive check
          const mime = (item.mimeType || '').toLowerCase();
          if (filterType === 'image') return mime.startsWith('image/');
          if (filterType === 'video') return mime.startsWith('video/');
          if (filterType === 'document')
            return (
              mime.indexOf('pdf') > -1 ||
              mime.indexOf('word') > -1 ||
              mime.indexOf('text') > -1
            );
          return true;
        });
      }

      if (searchQuery) {
        combinedItems = combinedItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      setItems(combinedItems);
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      showModal({
        title: 'Error',
        description: 'Failed to load contents',
        variant: 'danger',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [parentId, isRoot, searchQuery, activeTab, filterType]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  useFocusEffect(
    useCallback(() => {
      dispatch(setCurrentFolderId(parentId));
    }, [dispatch, parentId]),
  );

  const handleShare = (item: any) => {
    setItemToShare(item);
    setShareModalVisible(true);
  };

  const handleCreateFolder = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const submitCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await fileService.createFolder(
        newFolderName.trim(),
        parentId || undefined,
      );
      setShowCreateFolderModal(false);
      loadContents();
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const handleDelete = async (item: any) => {
    showModal({
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
            try {
              if (item.isFolder) {
                await fileService.deleteFolder(item.id);
              } else {
                await fileService.deleteFile(item.id);
              }
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              console.error(error);
              setTimeout(() => {
                showModal({
                  title: 'Error',
                  description: 'Failed to delete item',
                  variant: 'danger',
                  icon: 'error',
                });
              }, 300);
            }
          },
        },
      ],
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <FileItemCard
        file={item}
        isRevealed={revealedFileId === item.id}
        onExpand={() => setRevealedFileId(item.id)}
        onCollapse={() => revealedFileId === item.id && setRevealedFileId(null)}
        onDownload={() => {
          if (item.isFolder) return;
          downloadManager.startDownload(
            item.id,
            item.name,
            item.size,
            item.mimeType,
          );
        }}
        onDelete={() => handleDelete(item)}
        onShare={() => handleShare(item)}
        isGrid={viewMode === 'GRID'}
        isGallery={!!filterType}
        onClick={() => {
          if (item.isFolder) {
            navigation.push('Files', {
              folderId: item.id,
              folderName: item.name,
              filterType,
              viewMode: filterType ? 'GRID' : 'LIST',
            });
          } else {
            // Updated Viewer Navigation for Gallery Swiping
            const galleryFiles = items.filter(i => !i.isFolder);
            const initialIndex = galleryFiles.findIndex(f => f.id === item.id);
            navigation.navigate('Viewer', {
              fileId: item.id,
              fileName: item.name,
              fileType: item.mimeType,
              context: {
                files: galleryFiles,
                initialIndex: Math.max(0, initialIndex),
              },
            });
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {(!isRoot || filterType) && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconButton}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={20}
                  color={Colors.black}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.mainTitle}>{initialFolderName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Activities')}
            >
              <MaterialIcons name="swap-vert" size={24} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialIcons
                name="notifications-none"
                size={24}
                color="#1E293B"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchWrapper}>
          <SearchBar
            searchQuery={searchQuery}
            onQueryChange={setSearchQuery}
            onFilterClick={() => {}}
            searchResults={[]}
            placeholder="Search"
            style={styles.searchBar}
          />
        </View>
      </View>

      <View style={styles.contentArea}>
        {!filterType && (
          <View style={styles.sortHeader}>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortText}>Name</Text>
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color="#1E293B"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            {isRoot && (
              <View style={styles.tabSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.miniTab,
                    activeTab === 'FOLDERS' && styles.miniTabActive,
                  ]}
                  onPress={() => setActiveTab('FOLDERS')}
                >
                  <Text
                    style={[
                      styles.miniTabText,
                      activeTab === 'FOLDERS' && styles.miniTabTextActive,
                    ]}
                  >
                    Folders
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.miniTab,
                    activeTab === 'FILES' && styles.miniTabActive,
                  ]}
                  onPress={() => setActiveTab('FILES')}
                >
                  <Text
                    style={[
                      styles.miniTabText,
                      activeTab === 'FILES' && styles.miniTabTextActive,
                    ]}
                  >
                    Files
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.rightActions}>
              <TouchableOpacity
                style={styles.miniIconButton}
                onPress={() =>
                  setViewMode(viewMode === 'LIST' ? 'GRID' : 'LIST')
                }
              >
                <MaterialIcons
                  name={viewMode === 'LIST' ? 'grid-view' : 'view-list'}
                  size={24}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.purple.vibrant} />
          </View>
        ) : (
          <FlatList
            key={filterType ? 'GALLERY' : viewMode} // Force re-render on mode change
            data={items}
            renderItem={renderItem}
            numColumns={filterType ? 4 : viewMode === 'GRID' ? 2 : 1}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={
              filterType
                ? { padding: 4, paddingBottom: 100 }
                : styles.listContent
            }
            columnWrapperStyle={
              filterType
                ? undefined
                : viewMode === 'GRID'
                ? styles.columnWrapper
                : undefined
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No items</Text>
                <Text style={styles.emptySubtitle}>This folder is empty</Text>
              </View>
            }
          />
        )}
      </View>

      <AppModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        icon={modalConfig.icon}
        actions={modalConfig.actions}
      />
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        item={itemToShare}
      />
      <AppModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        title="New Folder"
        icon="create-new-folder"
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowCreateFolderModal(false),
            variant: 'secondary',
          },
          {
            text: 'Create',
            onPress: submitCreateFolder,
            variant: 'primary',
          },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Folder name"
          value={newFolderName}
          onChangeText={setNewFolderName}
          autoFocus
        />
      </AppModal>
      <UploadProgressModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: Typography.fontFamily.bold,
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  searchWrapper: {
    marginTop: 8,
  },
  searchBar: {
    marginBottom: 0,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIconButton: {
    marginLeft: 12,
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 4,
  },
  miniTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  miniTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  miniTabTextActive: {
    color: Colors.purple.vibrant,
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default FileScreen;
