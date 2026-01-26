import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { FileItem } from '../types';

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
}

const MENU_WIDTH = 160;

export const FileItemCard: React.FC<FileItemCardProps> = ({
  file,
  iconSize = 48,
  isRevealed,
  onExpand,
  onCollapse,
  onDownload,
  onDelete,
  onShare,
  onClick,
}) => {
  // We use prop-driven animation since parent controls the revealed state (one open at a time)
  // Converting boolean isRevealed to animated value
  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isRevealed ? -MENU_WIDTH : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 100,
    }).start();
  }, [isRevealed]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          onExpand();
        } else if (gestureState.dx > 50) {
          onCollapse();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            onCollapse();
            onDownload();
          }}
        >
          <MaterialIcons
            name="download"
            size={24}
            color={Colors.purple.vibrant}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            onCollapse();
            onShare();
          }}
        >
          <MaterialIcons name="link" size={24} color={Colors.purple.indigo} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            onCollapse();
            onDelete();
          }}
        >
          <MaterialIcons name="delete" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Foreground Card */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX: animatedValue }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={onClick}
          activeOpacity={0.9}
        >
          {/* Icon */}
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
                name={file.icon || 'insert-drive-file'}
                size={iconSize * 0.5}
                color={Colors.purple.vibrant}
              />
            )}
          </View>

          {/* Info */}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileDetails}>
              {file.size} • {file.timeAgo}
            </Text>
          </View>

          {/* More Menu Placeholder */}
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={24} color={Colors.gray} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80, // Approximate height
    marginVertical: 4,
    justifyContent: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    right: 8,
    width: MENU_WIDTH,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // evenly spaced manually via padding
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  iconContainer: {
    borderRadius: 10,
    backgroundColor: '#F3F4F6', // SearchBackground
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
    marginLeft: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  fileDetails: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
  },
  moreButton: {
    padding: 4,
  },
});
