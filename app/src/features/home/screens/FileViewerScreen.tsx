import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import { Colors } from '../../../theme/colors';
import { API_URL } from '@env';
import apiClient from '../../../services/api/apiClient';
import { databaseService } from '../../../services/db/DatabaseService';

const { width, height } = Dimensions.get('window');

const FileViewerScreen = ({ route, navigation }: any) => {
  const { fileId, fileName, fileType } = route.params;
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLocalCacheAndFetch();
  }, [fileId]);

  const checkLocalCacheAndFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Check SQLite Cache
      const localFile = databaseService.getFileById(fileId);
      const now = Date.now();

      if (
        localFile?.linkUrl &&
        localFile?.linkExpiresAt &&
        localFile.linkExpiresAt > now + 300000
      ) {
        console.log('✅ [Cache Hit]', fileName);
        setDownloadUrl(localFile.linkUrl);
        setIsLoading(false);
        return;
      }

      // 2. Fetch from Backend
      console.log('📡 [API Fetch] Fresh link for', fileName);
      const response = await apiClient.post(`/files/${fileId}/link`);

      if (response.data?.success) {
        const { linkUrl, expiresAt } = response.data.data;
        console.log('🔗 [Link Received]', linkUrl.substring(0, 50) + '...');
        setDownloadUrl(linkUrl);

        // 3. Update Cache
        const expiryTimestamp = new Date(expiresAt).getTime();
        databaseService.updateFileLink(fileId, linkUrl, expiryTimestamp);
      } else {
        throw new Error('Server returned unsuccessful response');
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

  const isImage = fileType?.startsWith('image/');
  const isVideo = fileType?.startsWith('video/');
  const isAudio = fileType?.startsWith('audio/');
  const isPdf = fileType === 'application/pdf';
  const isWebViewable =
    isPdf || fileType?.includes('text/') || fileType?.includes('html');

  const handleShare = async () => {
    if (!downloadUrl) return;
    try {
      await Share.share({
        message: `Check out this file: ${fileName}\n${downloadUrl}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenExternally = () => {
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <MaterialIcons name="share" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.purple.vibrant} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons
              name="error-outline"
              size={64}
              color={Colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {isImage ? (
              <Image
                source={{ uri: downloadUrl || undefined }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            ) : isVideo ? (
              <Video
                source={{ uri: downloadUrl! }}
                style={styles.mainVideo}
                controls={true}
              />
            ) : isWebViewable ? (
              <WebView
                source={{ uri: downloadUrl! }}
                style={styles.webview}
                startInLoadingState={true}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialIcons
                  name={isAudio ? 'audiotrack' : 'insert-drive-file'}
                  size={120}
                  color={Colors.purple.indigo}
                />
                <Text style={styles.fileTypeText}>{fileType || 'File'}</Text>
                <TouchableOpacity
                  style={styles.openButton}
                  onPress={handleOpenExternally}
                >
                  <Text style={styles.openButtonText}>Open in Device</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>File Type</Text>
          <Text style={styles.footerValue}>{fileType || 'Unknown'}</Text>
        </View>
        <TouchableOpacity
          style={styles.downloadFab}
          onPress={handleOpenExternally}
        >
          <MaterialIcons name="file-download" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  actionButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Dark background for media
  },
  mainImage: {
    width: width,
    height: height * 0.7,
  },
  mainVideo: {
    width: width,
    height: height * 0.7,
  },
  webview: {
    width: width,
    height: height * 0.7,
    backgroundColor: '#fff',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
  },
  fileTypeText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '500',
  },
  openButton: {
    marginTop: 32,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.purple.vibrant,
  },
  openButtonText: {
    color: Colors.purple.vibrant,
    fontWeight: 'bold',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  downloadFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.purple.vibrant,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default FileViewerScreen;
