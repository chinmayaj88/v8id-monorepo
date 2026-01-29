import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import AppModal from '../../../components/AppModal';
import { useUploadProgress } from '../services/UploadManager';

const UploadProgressModal: React.FC = () => {
  const { tasks, activeTasks, clearCompleted } = useUploadProgress();

  if (tasks.length === 0) return null;

  const isAnyActive = activeTasks.length > 0;

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isAnyActive
              ? `Uploading ${activeTasks.length} items...`
              : 'Uploads Completed'}
          </Text>
          {!isAnyActive && (
            <TouchableOpacity onPress={clearCompleted}>
              <MaterialIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.taskList}>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskInfo}>
                <MaterialIcons
                  name={
                    task.status === 'COMPLETED'
                      ? 'check-circle'
                      : 'insert-drive-file'
                  }
                  size={24}
                  color={
                    task.status === 'COMPLETED'
                      ? Colors.success
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
                      : task.status}
                  </Text>
                </View>
              </View>
              {task.status === 'UPLOADING' && (
                <ActivityIndicator size="small" color={Colors.purple.vibrant} />
              )}
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
    bottom: 90,
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
});

export default UploadProgressModal;
