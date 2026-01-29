import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../../../store/hooks';
import { Colors } from '../../../theme/colors';
import { TaskStatus } from '../../../store/uploadSlice';

interface TransferStatusIconProps {
  onPress: () => void;
}

const ACTIVE_STATUSES: TaskStatus[] = [
  'UPLOADING',
  'DOWNLOADING',
  'PENDING',
  'RESUMING',
];

export const TransferStatusIcon: React.FC<TransferStatusIconProps> = ({
  onPress,
}) => {
  const { tasks } = useAppSelector(state => state.transfer);

  const activeTasks = useMemo(() => {
    return tasks.filter(t => ACTIVE_STATUSES.includes(t.status));
  }, [tasks]);

  const { isTransferring, progress, type } = useMemo(() => {
    if (activeTasks.length === 0) {
      return { isTransferring: false, progress: 0, type: 'NONE' };
    }

    const totalProgress = activeTasks.reduce(
      (acc, t) => acc + (t.progress || 0),
      0,
    );
    const avgProgress = totalProgress / activeTasks.length / 100; // Normalize to 0-1

    // Determine type (prioritize upload if mixed)
    const isUploading = activeTasks.some(t => t.type === 'UPLOAD');

    return {
      isTransferring: true,
      progress: avgProgress,
      type: isUploading ? 'UPLOAD' : 'DOWNLOAD',
    };
  }, [activeTasks]);

  if (!isTransferring) {
    return (
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <MaterialIcons name="file-download" size={28} color={Colors.black} />
      </TouchableOpacity>
    );
  }

  // Progress Circle config
  const size = 32; // slightly larger than icon
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const iconName = type === 'UPLOAD' ? 'cloud-upload' : 'cloud-download';
  const iconColor = Colors.purple.vibrant;

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View
        style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg height={size} width={size} style={styles.svg}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.iconContainer}>
          <MaterialIcons name={iconName} size={18} color={iconColor} />
          {activeTasks.length > 1 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeTasks.length}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
