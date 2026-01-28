import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { databaseService } from '../../../services/db/DatabaseService';
import fileService from '../../../services/api/fileService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FileItemCard } from '../components/FileItemCard';
import { SearchBar } from '../components/SearchBar';

type SubTab = 'FOLDERS' | 'FILES';

const FolderScreen = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const parentId = route.params?.folderId || null;
  const initialFolderName = route.params?.folderName || 'Cloud Drive';

  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<SubTab>('FOLDERS');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedFileId, setRevealedFileId] = useState<string | null>(null);

  const isRoot = parentId === null;

  const loadContents = useCallback(async () => {
    setIsLoading(true);

    try {
      const parentIdArg = isRoot ? undefined : parentId;
      const data = await fileService.listFolderContents(parentIdArg);

      // Map API response to UI items
      const folderItems = (data.folders || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: '', // Folders don't usually have size in list
        timeAgo: new Date(f.updatedAt).toLocaleDateString(),
        isFolder: true,
        color: f.color,
      }));

      const fileItems = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        timeAgo: new Date(f.updatedAt).toLocaleDateString(),
        mimeType: f.mimeType,
        thumbnailUrl: f.thumbnailUrl,
        folderId: f.folderId,
        isFolder: false,
      }));

      let combinedItems = [];

      if (isRoot) {
        if (activeTab === 'FOLDERS') {
          combinedItems = folderItems;
        } else {
          combinedItems = fileItems;
        }
      } else {
        combinedItems = [...folderItems, ...fileItems];
      }

      if (searchQuery) {
        combinedItems = [...folderItems, ...fileItems].filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      // Sort by folder first, then file? or just combined.
      // The previous local DB logic had explicit sorting. API logic might be separate.
      setItems(combinedItems);
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      Alert.alert('Error', 'Failed to load contents');
    } finally {
      setIsLoading(false);
    }
  }, [parentId, isRoot, searchQuery]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const handleDelete = async (item: any) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.isFolder) {
                await fileService.deleteFolder(item.id);
              } else {
                await fileService.deleteFile(item.id);
              }
              // Optimistically update UI
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.isFolder) {
      return (
        <TouchableOpacity
          style={styles.folderRow}
          onPress={() => {
            navigation.push('Folders', {
              folderId: item.id,
              folderName: item.name,
            });
          }}
          activeOpacity={0.7}
        >
          {/* Circular Icon Background matching design */}
          <View
            style={[
              styles.folderIconBg,
              { backgroundColor: item.color || '#E0F2F1' },
            ]}
          >
            <MaterialIcons
              name="folder"
              size={24}
              color={Colors.purple.vibrant}
            />
          </View>
          <View style={styles.folderInfo}>
            <Text style={styles.folderName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.folderDate}>{item.size || item.timeAgo}</Text>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleDelete(item)}
          >
            <MaterialIcons name="more-horiz" size={24} color="#64748B" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return (
      <FileItemCard
        file={item}
        isRevealed={revealedFileId === item.id}
        onExpand={() => setRevealedFileId(item.id)}
        onCollapse={() => revealedFileId === item.id && setRevealedFileId(null)}
        onDownload={() => {}}
        onDelete={() => handleDelete(item)}
        onShare={() => {}}
        onClick={() => {
          // @ts-ignore
          navigation.navigate('Viewer', {
            fileId: item.id,
            fileName: item.name,
            fileType: item.mimeType,
          });
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header Section */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {!isRoot && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
            )}
            <Text style={styles.mainTitle}>{initialFolderName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="cloud-upload" size={24} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons
                name="check-circle-outline"
                size={24}
                color="#1E293B"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
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

        {/* Action Buttons Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionRow}
          contentContainerStyle={styles.actionRowContent}
        >
          <TouchableOpacity
            style={[styles.actionChip, { backgroundColor: '#E0F2F1' }]}
          >
            <MaterialIcons name="file-upload" size={20} color="#00695C" />
            <Text style={[styles.actionChipText, { color: '#00695C' }]}>
              Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { backgroundColor: '#FCE4EC' }]}
          >
            <MaterialIcons name="create-new-folder" size={20} color="#C2185B" />
            <Text style={[styles.actionChipText, { color: '#C2185B' }]}>
              Folder
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { backgroundColor: '#E3F2FD' }]}
          >
            <MaterialIcons name="document-scanner" size={20} color="#0D47A1" />
            <Text style={[styles.actionChipText, { color: '#0D47A1' }]}>
              Scan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area - Rounded Top */}
      <View style={styles.contentArea}>
        {/* Sort Header */}
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

          {/* Tab Switcher if Root */}
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

          <TouchableOpacity>
            <MaterialIcons name="list" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.purple.vibrant} />
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  topSection: {
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  searchBar: {
    marginBottom: 0,
  },
  actionRow: {
    marginTop: 20,
    paddingLeft: 20,
  },
  actionRowContent: {
    paddingRight: 20,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  actionChipText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#E6F4EA', // Light green tint from image
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  folderIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  folderDate: {
    fontSize: 13,
    color: '#64748B',
  },
  moreButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#64748B',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  miniTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  miniTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  miniTabTextActive: {
    color: '#1E293B',
  },
});

export default FolderScreen;
