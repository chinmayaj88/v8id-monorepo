import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { Colors, Typography } from '../../../theme';
import { clearCompleted, removeTask } from '../../../store/uploadSlice';

const ActivitiesScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector(state => state.transfer);

  const sortedTasks = useMemo(() => {
    return [...tasks].reverse();
  }, [tasks]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.taskItem}>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={item.type === 'UPLOAD' ? 'cloud-upload' : 'cloud-download'}
          size={24}
          color={Colors.purple.vibrant}
        />
      </View>
      <View style={styles.taskInfo}>
        <Text style={styles.taskName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.taskStatus}>
          {item.status} • {Math.round(item.progress || 0)}%
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => dispatch(removeTask(item.id))}
        style={styles.removeButton}
      >
        <MaterialIcons name="close" size={20} color={Colors.gray} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Transfer Activities</Text>
        <TouchableOpacity
          onPress={() => dispatch(clearCompleted())}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedTasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color={Colors.border} />
            <Text style={styles.emptyText}>No recent transfer activities</Text>
          </View>
        }
      />
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
    height: 64,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: Colors.purple.vibrant,
    fontFamily: Typography.fontFamily.bold,
  },
  listContent: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple.subtleTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  taskStatus: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
    fontFamily: Typography.fontFamily.medium,
  },
});

export default ActivitiesScreen;
