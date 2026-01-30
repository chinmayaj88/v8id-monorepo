import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Linking,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import { Colors } from '../../../theme/colors';
import fileService from '../../../services/api/fileService';
import { databaseService } from '../../../services/db/DatabaseService';

const { width, height } = Dimensions.get('window');

const ViewerPage = ({ fileId, fileName, fileType, isVisible }: any) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      checkLocalCacheAndFetch();
    }
  }, [fileId, isVisible]);

  const checkLocalCacheAndFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const localFile = databaseService.getFileById(fileId);
      const now = Date.now();

      if (
        localFile?.linkUrl &&
        localFile?.linkExpiresAt &&
        localFile.linkExpiresAt > now + 300000
      ) {
        setDownloadUrl(localFile.linkUrl);
        setIsLoading(false);
        return;
      }

      const result = await fileService.generateLink(fileId);

      if (result && result.success) {
        const { url } = result;
        const linkUrl = url || result.linkUrl;
        setDownloadUrl(linkUrl);

        const expiryTimestamp = new Date(result.expiresAt).getTime();
        databaseService.updateFileLink(fileId, linkUrl, expiryTimestamp);
      } else {
        throw new Error('Server successfully returned error status');
      }
    } catch (err: any) {
      console.error('❌ [Viewer Error]', err);
      const msg =
        err.response?.data?.message || err.message || 'Error loading file';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isImage = fileType?.toLowerCase().startsWith('image/');
  const isVideo = fileType?.toLowerCase().startsWith('video/');
  const isAudio = fileType?.toLowerCase().startsWith('audio/');
  const isPdf = fileType?.toLowerCase() === 'application/pdf';
  const isWebViewable =
    isPdf ||
    fileType?.toLowerCase().includes('text/') ||
    fileType?.toLowerCase().includes('html');

  const handleOpenExternally = () => {
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple.vibrant} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkLocalCacheAndFetch}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <View style={styles.mediaContainer}>
        {isImage ? (
          <Image
            source={{ uri: downloadUrl! }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        ) : isVideo ? (
          <Video
            source={{ uri: downloadUrl! }}
            style={styles.mainVideo}
            controls={true}
            paused={!isVisible} // Auto-pause if not visible
            // @ts-ignore
            resizeMode="contain"
            onError={e => console.error('Video Error:', e)}
          />
        ) : isWebViewable ? (
          <WebView
            source={{ uri: downloadUrl! }}
            style={styles.webview}
            startInLoadingState={true}
            originWhitelist={['*']}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons
              name={isAudio ? 'audiotrack' : 'insert-drive-file'}
              size={120}
              color={Colors.purple.indigo}
            />
            <Text style={styles.fileTypeText}>
              {fileType || 'Unrecognized File'}
            </Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={handleOpenExternally}
            >
              <Text style={styles.openButtonText}>Open with System App</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const FileViewerScreen = ({ route, navigation }: any) => {
  const { fileId, fileName, fileType, context } = route.params;
  const flatListRef = useRef<FlatList>(null);

  // If context provided, use it. Otherwise single file.
  const files = context?.files || [
    { id: fileId, name: fileName, mimeType: fileType },
  ];
  const initialIndex = context?.initialIndex || 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentFile = files[currentIndex] || files[0];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this file: ${currentFile.name}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {currentFile.name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <MaterialIcons name="share" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={files}
        horizontal
        pagingEnabled
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item, index }) => (
          <ViewerPage
            fileId={item.id}
            fileName={item.name}
            fileType={item.mimeType}
            isVisible={index === currentIndex}
          />
        )}
      />

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {currentIndex + 1} / {files.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 40, // Adjust for safe area
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: { padding: 8 },
  actionButton: { padding: 8 },
  title: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  pageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
  },
  webview: {
    width: width,
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  fileTypeText: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 18,
  },
  openButton: {
    marginTop: 20,
    backgroundColor: Colors.purple.vibrant,
    padding: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#FFF',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 20,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: { color: '#FFF' },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default FileViewerScreen;
