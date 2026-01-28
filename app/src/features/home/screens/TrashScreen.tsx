import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Text,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../theme/colors';
import fileService, {
  FileDTO,
  FolderDTO,
} from '../../../services/api/fileService';
import { FileItem } from '../types';
import FileItemCard from '../components/FileItemCard';
import { SafeAreaView } from 'react-native-safe-area-context';

export const TrashScreen = () => {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedItemId, setRevealedItemId] = useState<string | null>(null);

  const fetchTrash = async () => {
    try {
      setIsLoading(true);
      const data = await fileService.listTrash();

      const folders: FileItem[] = (data.folders || []).map((f: FolderDTO) => ({
        id: f.id,
        name: f.name,
        size: '',
        timeAgo: '', // You might want to format updatedAt if available
        isFolder: true,
        folderId: f.parentId,
      }));

      const files: FileItem[] = (data.files || []).map((f: FileDTO) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        timeAgo: new Date(f.updatedAt).toLocaleDateString(),
        isFolder: false,
        thumbnailUrl: f.thumbnailUrl,
        folderId: f.folderId,
      }));

      setItems([...folders, ...files]);
    } catch (error) {
      console.error('Failed to load trash', error);
      Alert.alert('Error', 'Failed to load trash contents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (item: FileItem) => {
    try {
      if (item.isFolder) {
        await fileService.restoreFolder(item.id);
      } else {
        await fileService.restoreFile(item.id);
      }
      setItems(prev => prev.filter(i => i.id !== item.id));
      Alert.alert('Success', 'Item restored');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore item');
    }
  };

  const handleDeletePermanent = async (item: FileItem) => {
    Alert.alert('Permanent Delete', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.isFolder) {
              await fileService.deleteFolder(item.id, true);
            } else {
              await fileService.deleteFile(item.id, true);
            }
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item permanently');
          }
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: FileItem }) => (
      <FileItemCard
        file={item}
        isRevealed={revealedItemId === item.id}
        onExpand={() => setRevealedItemId(item.id)}
        onCollapse={() => setRevealedItemId(null)}
        onClick={() => {}} // No action on click in trash? or show details?
        onDownload={() => {}} // Disabled in trash
        onShare={() => {}} // Disabled in trash
        onDelete={() => handleDeletePermanent(item)}
        isTrashMode={true}
        onRestore={() => handleRestore(item)}
      />
    ),
    [revealedItemId],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Trash</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Trash is empty</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchTrash} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
  },
});
