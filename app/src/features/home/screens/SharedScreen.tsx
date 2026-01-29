import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import fileService from '../../../services/api/fileService';
import { FileItemCard } from '../components/FileItemCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppDispatch } from '../../../store/hooks';
import { setCurrentFolderId } from '../../../store/uiSlice';

const SharedScreen = () => {
  const navigation: any = useNavigation();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      dispatch(setCurrentFolderId(null));
    }, [dispatch]),
  );

  const loadSharedItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fileService.listSharedWithMe();

      const fileItems = (data.files || []).map((s: any) => ({
        ...s.file,
        id: s.file.id,
        shareId: s.id,
        permission: s.permission,
        sharedAt: s.sharedAt,
        ownerName: s.file.ownerName,
        isFolder: false,
        timeAgo: 'Shared ' + new Date(s.sharedAt).toLocaleDateString(),
      }));

      const folderItems = (data.folders || []).map((s: any) => ({
        ...s.folder,
        id: s.folder.id,
        shareId: s.id,
        permission: s.permission,
        sharedAt: s.sharedAt,
        ownerName: s.folder.ownerName,
        isFolder: true,
        timeAgo: 'Shared ' + new Date(s.sharedAt).toLocaleDateString(),
      }));

      setItems([...folderItems, ...fileItems]);
    } catch (error) {
      console.error('Failed to load shared items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedItems();
  }, [loadSharedItems]);

  const renderItem = ({ item }: { item: any }) => {
    return (
      <FileItemCard
        file={item}
        isRevealed={false}
        onExpand={() => {}}
        onCollapse={() => {}}
        onDownload={() => {}}
        onDelete={() => {}}
        onShare={() => {}}
        onClick={() => {
          if (item.isFolder) {
            // @ts-ignore
            navigation.navigate('Folders', {
              folderId: item.id,
              folderName: item.name,
              isShared: true,
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared with me</Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.purple.vibrant} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadSharedItems}
              colors={[Colors.purple.vibrant]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="share" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nothing shared with you yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

export default SharedScreen;
