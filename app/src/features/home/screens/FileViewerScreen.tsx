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
import apiClient from '../../../services/api/apiClient';
import fileService from '../../../services/api/fileService';
import { databaseService } from '../../../services/db/DatabaseService';

const { width } = Dimensions.get('window');

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

      console.log('📡 [API Fetch] Fresh link for', fileName);
      // Use service method which handles the correct endpoint
      const result = await fileService.generateLink(fileId);

      if (result && result.success) {
        const { url, expiresAt } = result; // API returns 'url', ensure we map it if service returns 'linkUrl' or 'url'
        const linkUrl = url || result.linkUrl; // Handle safe extraction

        console.log('🔗 [Link Received] PAR URL Generated');
        setDownloadUrl(linkUrl);

        const expiryTimestamp = new Date(expiresAt).getTime();
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

  const handleShare = async () => {
    if (!downloadUrl) return;
    try {
      await Share.share({
        message: `Check out this cloud file: ${fileName}\n\nLink: ${downloadUrl}`,
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.purple.vibrant} />
            <Text style={styles.loadingText}>Securing cloud link...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons
              name="error-outline"
              size={64}
              color={Colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={checkLocalCacheAndFetch}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                paused={false}
                // @ts-ignore
                resizeMode="contain"
                onError={e => {
                  console.error('Video Error:', e);
                  setError(
                    'Playback failed. This video format or resolution (e.g., 8K/MKV) might not be supported on this device.',
                  );
                }}
              />
            ) : isWebViewable ? (
              <WebView
                source={{ uri: downloadUrl! }}
                style={styles.webview}
                startInLoadingState={true}
                originWhitelist={['*']}
                allowsFullscreenVideo={true}
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
                  <Text style={styles.openButtonText}>
                    Open with System App
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>File Meta</Text>
          <Text style={styles.footerValue}>
            {fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionFab}
            onPress={handleOpenExternally}
          >
            <MaterialIcons name="open-in-new" size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionFab,
              { backgroundColor: Colors.purple.indigo, marginLeft: 12 },
            ]}
            onPress={handleOpenExternally}
          >
            <MaterialIcons
              name="file-download"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { padding: 8 },
  actionButton: { padding: 8 },
  titleContainer: { flex: 1, marginHorizontal: 16 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#AAA',
    fontSize: 14,
  },
  mediaContainer: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFF',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 24,
    margin: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fileTypeText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  openButton: {
    marginTop: 32,
    backgroundColor: Colors.purple.vibrant,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 32,
  },
  openButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.black,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: '#FF6B6B',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerInfo: { flex: 1 },
  footerLabel: {
    fontSize: 11,
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.black,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});

export default FileViewerScreen;
