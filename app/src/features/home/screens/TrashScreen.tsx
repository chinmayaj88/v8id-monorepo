import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
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
import AppModal from '../../../components/AppModal';

export const TrashScreen = () => {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedItemId, setRevealedItemId] = useState<string | null>(null);

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
      showModal({
        title: 'Error',
        description: 'Failed to load trash contents',
        variant: 'danger',
        icon: 'error',
      });
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
      showModal({
        title: 'Success',
        description: 'Item restored successfully',
        variant: 'success',
        icon: 'check-circle',
      });
    } catch (error) {
      showModal({
        title: 'Error',
        description: 'Failed to restore item',
        variant: 'danger',
        icon: 'error',
      });
    }
  };

  const handleDeletePermanent = async (item: FileItem) => {
    showModal({
      title: 'Permanent Delete',
      description:
        'Are you sure? This action cannot be undone and the item will be lost forever.',
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
                await fileService.deleteFolder(item.id, true);
              } else {
                await fileService.deleteFile(item.id, true);
              }
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              // We need a slight delay or separate state to show error modal after closing confirmation
              // But for simplicity, we call showModal again.
              // Note: calling setModalConfig immediately might race if not careful with state batching,
              // but widely robust in React 18+.
              setTimeout(() => {
                showModal({
                  title: 'Error',
                  description: 'Failed to delete item permanently',
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

  const renderItem = useCallback(
    ({ item }: { item: FileItem }) => (
      <FileItemCard
        file={item}
        isRevealed={revealedItemId === item.id}
        onExpand={() => setRevealedItemId(item.id)}
        onCollapse={() => setRevealedItemId(null)}
        onClick={() => {}}
        onDownload={() => {}}
        onShare={() => {}}
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

      <AppModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        icon={modalConfig.icon}
        actions={modalConfig.actions}
      />
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
