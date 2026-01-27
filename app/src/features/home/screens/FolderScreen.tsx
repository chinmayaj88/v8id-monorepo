import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { databaseService } from '../../../services/db/DatabaseService';
import { useNavigation, useRoute } from '@react-navigation/native';

const FolderScreen = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const parentId = route.params?.folderId || null;
  const folderName = route.params?.folderName || 'Folders';

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContents = useCallback(() => {
    setIsLoading(true);
    // In a real app, we might sync here too.
    // For now, pull what we have in SQLite.

    // Get subfolders
    const folders = databaseService.search('').filter(s => s.type === 'FOLDER');
    // Simplified: our search returns all. In a real repository we'd have findByParentId.
    // Let's mock a simple filter for now since we don't have parentId logic in SQLite helper yet.
    setItems(folders);
    setIsLoading(false);
  }, [parentId]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        navigation.push('Folders', {
          folderId: item.id,
          folderName: item.title,
        });
      }}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="folder" size={30} color={Colors.purple.vibrant} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.details}>{item.subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.gray} />
    </TouchableOpacity>
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
        <Text style={styles.title}>{folderName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator
          style={styles.loader}
          color={Colors.purple.vibrant}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="folder-open" size={64} color={Colors.gray} />
              <Text style={styles.emptyText}>No folders found</Text>
            </View>
          }
        />
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.purple.subtleTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  details: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
});

export default FolderScreen;
