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
}

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
  }) => {
    // Define actions based on mode
    const actions: SwipeAction[] = useMemo(() => {
      if (isTrashMode) {
        return [
          {
            icon: 'restore',
            color: Colors.white,
            backgroundColor: Colors.success,
            onPress: () => {
              onCollapse();
              onRestore && onRestore();
            },
          },
          {
            icon: 'delete-forever',
            color: Colors.white,
            backgroundColor: '#EF4444',
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
          color: '#1F2937', // Dark gray/black icon on yellow
          backgroundColor: '#FDE047', // Yellow
          onPress: () => {
            onCollapse();
            onShare();
          },
        },
        {
          icon: 'file-download',
          color: Colors.white,
          backgroundColor: '#3B82F6', // Blue
          onPress: () => {
            onCollapse();
            onDownload();
          },
        },
        {
          icon: 'delete',
          color: Colors.white,
          backgroundColor: '#EF4444', // Red
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
                { width: iconSize, height: iconSize },
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
                  color={file.isFolder ? '#FFC107' : Colors.purple.vibrant}
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
    borderRadius: 14, // Squircle-ish
    backgroundColor: '#EEF2FF', // Subtle tint matching the folder icon usually
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
});

export default FileItemCard;
