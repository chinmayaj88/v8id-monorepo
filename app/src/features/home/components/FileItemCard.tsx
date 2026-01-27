import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
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

const MENU_WIDTH = 180;

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
  }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const lastOffset = useRef(0);

    // Sync animation with revealed state from parent
    React.useEffect(() => {
      const toValue = isRevealed ? -MENU_WIDTH : 0;
      lastOffset.current = toValue;
      Animated.spring(animatedValue, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
        restSpeedThreshold: 0.1,
        restDisplacementThreshold: 0.1,
      }).start();
    }, [isRevealed, animatedValue]);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => false,
          onMoveShouldSetPanResponder: (_, gestureState) => {
            // High threshold for horizontal swipe to avoid interference with vertical list scroll
            return (
              Math.abs(gestureState.dx) > 20 &&
              Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
            );
          },
          onPanResponderGrant: () => {
            // Pause flatlist or animations if needed
            animatedValue.setOffset(lastOffset.current);
            animatedValue.setValue(0);
          },
          onPanResponderMove: (evt, gestureState) => {
            // Explicitly limit the range here
            let val = gestureState.dx;
            const total = lastOffset.current + val;

            // Elastic resistance at the edges
            if (total < -MENU_WIDTH) {
              val =
                -MENU_WIDTH - lastOffset.current + (total + MENU_WIDTH) * 0.4;
            } else if (total > 0) {
              val = -lastOffset.current + total * 0.4;
            }

            animatedValue.setValue(val);
          },
          onPanResponderRelease: (_, gestureState) => {
            animatedValue.flattenOffset();
            const currentPos = lastOffset.current + gestureState.dx;

            const velocityX = gestureState.vx;
            // Stronger velocity bias for "flick" to open/close
            const shouldExpand =
              currentPos < -MENU_WIDTH / 2 || velocityX < -0.8;
            const shouldCollapse =
              currentPos > -MENU_WIDTH / 2 || velocityX > 0.8;

            if (
              shouldExpand &&
              (velocityX < 0 || currentPos < -MENU_WIDTH / 3)
            ) {
              onExpand();
            } else {
              onCollapse();
            }
          },
          onPanResponderTerminate: () => {
            animatedValue.flattenOffset();
            onCollapse();
          },
        }),
      [onExpand, onCollapse, animatedValue],
    );

    const fileIcon =
      file.icon || (file.isFolder ? 'folder' : 'insert-drive-file');

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
              name="file-download"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: Colors.purple.indigo },
            ]}
            onPress={() => {
              onCollapse();
              onShare();
            }}
          >
            <MaterialIcons name="share" size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF4444' }]}
            onPress={() => {
              onCollapse();
              onDelete();
            }}
          >
            <MaterialIcons name="delete-sweep" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Foreground Card */}
        <Animated.View
          renderToHardwareTextureAndroid={true}
          style={[
            styles.card,
            {
              transform: [{ translateX: animatedValue }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => (isRevealed ? onCollapse() : onClick())}
            activeOpacity={0.8}
          >
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

            <View style={styles.chevron}>
              <MaterialIcons name="chevron-right" size={20} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 74,
    marginVertical: 6,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    width: MENU_WIDTH,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.purple.vibrant,
  },
  card: {
    backgroundColor: Colors.white,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    borderRadius: 12,
    // Minimize expensive styles
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  iconContainer: {
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
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
    marginLeft: 14,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  fileDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chevron: {
    padding: 2,
  },
});

export default FileItemCard;
