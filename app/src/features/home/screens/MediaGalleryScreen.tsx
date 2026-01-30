import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../theme';
import fileService from '../../../services/api/fileService';
import { API_URL } from '@env';
import { useAppSelector } from '../../../store/hooks';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT - 8; // 24px padding * 2, 8px gap

const MediaGalleryScreen = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const { type } = route.params || { type: 'image' }; // 'image', 'video', 'document'
  const token = useAppSelector(state => state.auth.token);

  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fileService.getMediaAlbums(type);
      setAlbums(data || []);
    } catch (error) {
      console.error('Failed to load albums', error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const getTitle = () => {
    switch (type) {
      case 'image':
        return 'Photos';
      case 'video':
        return 'Videos';
      case 'document':
        return 'Documents';
      default:
        return 'Media';
    }
  };

  const renderAlbum = ({ item }: { item: any }) => {
    const thumbnailUrl = item.thumbnailKey
      ? `api/files/${item.thumbnailFileId}/thumbnail`
      : null;

    // Construct Grid source
    let source = null;
    if (thumbnailUrl) {
      const baseUrl = API_URL.replace(/\/api\/?$/, '');
      source = {
        uri: `${baseUrl}/${thumbnailUrl}`,
        headers: { Authorization: `Bearer ${token}` },
      };
    }

    return (
      <TouchableOpacity
        style={styles.albumCard}
        onPress={() => {
          navigation.navigate('Files', {
            folderId: item.folderId, // null for Root
            folderName: item.folderName,
            filterType: type, // Pass filter to FileScreen
            viewMode: type === 'document' ? 'LIST' : 'GRID',
          });
        }}
      >
        <View style={styles.albumPreview}>
          {source ? (
            <Image
              source={source}
              style={styles.albumImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.albumImage, styles.placeholderAlbum]}>
              <MaterialIcons
                name={type === 'video' ? 'movie' : 'image'}
                size={40}
                color={Colors.purple.light}
              />
            </View>
          )}
          {type === 'video' && (
            <View style={styles.videoBadge}>
              <MaterialIcons name="play-arrow" size={16} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={styles.albumName} numberOfLines={1}>
          {item.folderName}
        </Text>
        <Text style={styles.albumCount}>{item.count} items</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple.vibrant} />
        </View>
      ) : (
        <FlatList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={(item, index) => item.folderId || 'root'}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No albums found</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  albumCard: {
    width: ITEM_WIDTH,
    marginBottom: 20,
  },
  albumPreview: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH, // Square
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  placeholderAlbum: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  albumCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MediaGalleryScreen;
