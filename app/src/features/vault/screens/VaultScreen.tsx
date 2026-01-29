import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../theme/colors';
import vaultService, {
  VaultSecretListItem,
} from '../../../services/api/vaultService';
import AddVaultSecretModal from '../components/AddVaultSecretModal';
import ViewVaultSecretModal from '../components/ViewVaultSecretModal';
import { SearchBar } from '../../home/components/SearchBar';

const CATEGORIES = [
  'ALL',
  'GENERAL',
  'SOCIAL',
  'WORK',
  'BANKING',
  'SHOPPING',
  'OTHER',
];

const VaultScreen = () => {
  const [secrets, setSecrets] = useState<VaultSecretListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchSecrets = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const data =
        query.length >= 2
          ? await vaultService.searchSecrets(query)
          : await vaultService.listSecrets();
      setSecrets(data);
    } catch (error) {
      console.error('Failed to fetch vault secrets:', error);
      Alert.alert('Error', 'Could not load your vault. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSecrets(searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2 || text.length === 0) {
      fetchSecrets(text);
    }
  };

  const filteredSecrets = secrets.filter(
    s => selectedCategory === 'ALL' || s.category === selectedCategory,
  );

  const renderVaultItem = ({ item }: { item: VaultSecretListItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedSecretId(item.id);
        setViewModalVisible(true);
      }}
    >
      <View style={styles.iconContainer}>
        <Icon name="shield-lock" size={24} color={Colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>
          {item.username || item.url || 'No extra info'}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={Colors.gray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Vault</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="plus" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          searchQuery={searchQuery}
          onQueryChange={handleSearch}
          placeholder="Search credentials..."
          style={{ width: '100%' }}
        />
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextSelected,
                ]}
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={filteredSecrets}
          renderItem={renderVaultItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="lock-open-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No credentials found' : 'Your vault is empty'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.emptyAddButtonText}>
                    Add your first secret
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <AddVaultSecretModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => fetchSecrets(searchQuery)}
      />

      <ViewVaultSecretModal
        visible={viewModalVisible}
        secretId={selectedSecretId}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedSecretId(null);
        }}
        onDeleteSuccess={() => fetchSecrets(searchQuery)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    zIndex: 100,
  },
  categoriesWrapper: {
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.purple.subtleTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.gray,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.gray,
    marginTop: 15,
    textAlign: 'center',
  },
  emptyAddButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default VaultScreen;
