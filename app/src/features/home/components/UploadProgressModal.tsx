import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import AppModal from '../../../components/AppModal';
import { useUploadProgress } from '../services/UploadManager';
import { downloadManager } from '../services/DownloadManager';

const UploadProgressModal: React.FC = () => {
  const {
    tasks,
    activeTasks,
    clearCompleted,
    pauseTask,
    resumeTask,
    stopTask,
  } = useUploadProgress();
  const insets = useSafeAreaInsets();

  if (tasks.length === 0) return null;

  const isAnyActive = activeTasks.length > 0;

  return (
    <View
      style={[
        styles.floatingContainer,
        { bottom: (insets.bottom > 0 ? insets.bottom + 12 : 24) + 84 },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isAnyActive
              ? `Processing ${activeTasks.length} items...`
              : 'All activities completed'}
          </Text>
          <TouchableOpacity onPress={clearCompleted}>
            <MaterialIcons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.taskList}>
          {tasks.map((task: any) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskInfo}>
                <MaterialIcons
                  name={
                    task.status === 'COMPLETED'
                      ? 'check-circle'
                      : task.status === 'PAUSED'
                      ? 'pause-circle-filled'
                      : 'insert-drive-file'
                  }
                  size={24}
                  color={
                    task.status === 'COMPLETED'
                      ? Colors.success
                      : task.status === 'PAUSED'
                      ? '#64748B'
                      : Colors.purple.vibrant
                  }
                />
                <View style={styles.taskText}>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {task.name}
                  </Text>
                  <Text style={styles.taskStatus}>
                    {task.status === 'UPLOADING'
                      ? `Uploading... ${task.progress}%`
                      : task.status === 'DOWNLOADING'
                      ? `Downloading... ${task.progress}%`
                      : task.status === 'PAUSED'
                      ? `Paused at ${task.progress}%`
                      : task.status}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {(task.status === 'UPLOADING' ||
                  task.status === 'DOWNLOADING' ||
                  task.status === 'PENDING') && (
                  <TouchableOpacity
                    onPress={() => {
                      if (task.type === 'UPLOAD') pauseTask(task.id);
                      else downloadManager.pauseDownload(task.id);
                    }}
                    style={styles.iconButton}
                  >
                    <MaterialIcons name="pause" size={20} color="#64748B" />
                  </TouchableOpacity>
                )}
                {task.status === 'PAUSED' && (
                  <TouchableOpacity
                    onPress={() => {
                      if (task.type === 'UPLOAD') resumeTask(task.id);
                      else downloadManager.resumeDownload(task.id);
                    }}
                    style={styles.iconButton}
                  >
                    <MaterialIcons
                      name="play-arrow"
                      size={20}
                      color={Colors.purple.vibrant}
                    />
                  </TouchableOpacity>
                )}
                {(task.status === 'UPLOADING' ||
                  task.status === 'DOWNLOADING' ||
                  task.status === 'PENDING' ||
                  task.status === 'PAUSED') && (
                  <TouchableOpacity
                    onPress={() => stopTask(task.id)}
                    style={styles.iconButton}
                  >
                    <MaterialIcons name="stop" size={20} color={Colors.error} />
                  </TouchableOpacity>
                )}
                {(task.status === 'UPLOADING' ||
                  task.status === 'DOWNLOADING') && (
                  <ActivityIndicator
                    size="small"
                    color={Colors.purple.vibrant}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    right: 20,
    left: 20,
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskList: {
    maxHeight: 200,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskText: {
    marginLeft: 12,
    flex: 1,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  taskStatus: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default UploadProgressModal;
