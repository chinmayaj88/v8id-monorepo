import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../theme';
import { FileItem } from '../types';
import { SwipeableRow, SwipeAction } from '../../../components/SwipeableRow';

interface FileItemCardProps {
  file: FileItem;
  iconSize?: number;
  isRevealed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
  onClick: () => void;
  isTrashMode?: boolean;
  onRestore?: () => void;
  isGrid?: boolean;
}

// Helper to get glass styles based on file type
// Helper to get styled colors based on file type
const getFileStyles = (file: FileItem) => {
  if (file.isFolder) {
    return {
      backgroundColor: '#FFF8E1', // Amber 50
      iconColor: '#F59E0B', // Amber 600
    };
  }
  const mime = (file.mimeType || '').toLowerCase();

  if (mime.startsWith('image')) {
    return {
      backgroundColor: '#DCFCE7', // Green 100
      iconColor: '#22C55E', // Green 500
    };
  }

  if (mime.startsWith('video')) {
    return {
      backgroundColor: '#FCE7F3', // Pink 100
      iconColor: '#EC4899', // Pink 500
    };
  }

  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('text')
  ) {
    return {
      backgroundColor: '#DBEAFE', // Blue 100
      iconColor: '#3B82F6', // Blue 500
    };
  }

  if (mime.startsWith('audio')) {
    return {
      backgroundColor: '#F3E8FF', // Purple 100
      iconColor: '#A855F7',
    };
  }

  // Default
  return {
    backgroundColor: '#F1F5F9', // Slate 100
    iconColor: '#64748B',
  };
};

export const FileItemCard = React.memo<FileItemCardProps>(
  ({
    file,
    iconSize = 48,
    isRevealed,
    onExpand,
    onCollapse,
    onDownload,
    onDelete,
    onShare,
    onClick,
    isTrashMode,
    onRestore,
    isGrid,
  }) => {
    // Define actions based on mode
    const actions: SwipeAction[] = useMemo(() => {
      // Light tint pastel colors for actions
      const shareStyle = { bg: '#FEF9C3', icon: '#D97706' }; // Yellow 100, Yellow 700
      const downloadStyle = { bg: '#DBEAFE', icon: '#2563EB' }; // Blue 100, Blue 600
      const deleteStyle = { bg: '#FEE2E2', icon: '#DC2626' }; // Red 100, Red 600
      const restoreStyle = { bg: '#DCFCE7', icon: '#16A34A' }; // Green 100, Green 600

      if (isTrashMode) {
        return [
          {
            icon: 'restore',
            color: restoreStyle.icon,
            backgroundColor: restoreStyle.bg,
            onPress: () => {
              onCollapse();
              onRestore && onRestore();
            },
          },
          {
            icon: 'delete-forever',
            color: deleteStyle.icon,
            backgroundColor: deleteStyle.bg,
            onPress: () => {
              onCollapse();
              onDelete();
            },
          },
        ];
      }

      return [
        {
          icon: 'link', // or 'share'
          color: shareStyle.icon,
          backgroundColor: shareStyle.bg,
          onPress: () => {
            onCollapse();
            onShare();
          },
        },
        {
          icon: 'file-download',
          color: downloadStyle.icon,
          backgroundColor: downloadStyle.bg,
          onPress: () => {
            onCollapse();
            onDownload();
          },
        },
        {
          icon: 'delete',
          color: deleteStyle.icon,
          backgroundColor: deleteStyle.bg,
          onPress: () => {
            onCollapse();
            onDelete();
          },
        },
      ];
    }, [isTrashMode, onCollapse, onRestore, onDelete, onShare, onDownload]);

    const handleToggle = (revealed: boolean) => {
      if (revealed) onExpand();
      else onCollapse();
    };

    const fileIcon =
      file.icon || (file.isFolder ? 'folder' : 'insert-drive-file');

    const fileStyles = getFileStyles(file);

    if (isGrid) {
      return (
        <TouchableOpacity
          style={[styles.card, styles.gridCard]}
          onPress={onClick}
          onLongPress={onExpand}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.iconContainer,
              {
                width: 64,
                height: 64,
                backgroundColor: fileStyles.backgroundColor,
                marginBottom: 12,
              },
            ]}
          >
            {file.thumbnailUrl ? (
              <Image
                source={{ uri: file.thumbnailUrl }}
                style={styles.thumbnail}
              />
            ) : (
              <MaterialIcons
                name={fileIcon}
                size={32}
                color={fileStyles.iconColor}
              />
            )}
          </View>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.fileDetails} numberOfLines={1}>
            {file.isFolder ? 'Folder' : file.size}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <SwipeableRow
        isRevealed={isRevealed}
        onToggle={handleToggle}
        actions={actions}
        height={74}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => (isRevealed ? onCollapse() : onClick())}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View
              style={[
                styles.iconContainer,
                {
                  width: iconSize,
                  height: iconSize,
                  backgroundColor: fileStyles.backgroundColor,
                },
              ]}
            >
              {file.thumbnailUrl ? (
                <Image
                  source={{ uri: file.thumbnailUrl }}
                  style={styles.thumbnail}
                />
              ) : (
                <MaterialIcons
                  name={fileIcon}
                  size={iconSize * 0.5}
                  color={fileStyles.iconColor}
                />
              )}
            </View>

            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileDetails}>
                {file.isFolder ? 'Folder' : file.size} • {file.timeAgo}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.chevron}
              onPress={() => {
                if (isRevealed) onCollapse();
                else onExpand();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-horiz" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    borderRadius: 20, // Increased corner radius for premium look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  iconContainer: {
    borderRadius: 50, // Squircle-ish
    // backgroundColor removed, dynamic now
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1F2937',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#9CA3AF',
  },
  chevron: {
    padding: 4,
  },
  gridCard: {
    width: '48%',
    height: 160,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FileItemCard;
