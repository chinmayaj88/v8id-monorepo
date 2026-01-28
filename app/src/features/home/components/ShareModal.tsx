import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import AppModal from '../../../components/AppModal';
import { userService } from '../../../services/api/userService';
import fileService from '../../../services/api/fileService';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
  } | null;
  onShareSuccess?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  item,
  onShareSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>(
    'internal',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [internalPermission, setInternalPermission] = useState<'VIEW' | 'EDIT'>(
    'VIEW',
  );
  const [externalPermission, setExternalPermission] = useState<
    'VIEW' | 'DOWNLOAD'
  >('VIEW');
  const [expiryDays, setExpiryDays] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setExpiryDays('');
      setIsSharing(false);
    }
  }, [visible]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const users = await userService.searchUsers(query);
        // Filter out already selected users
        setSearchResults(
          users.filter(u => !selectedUsers.find(su => su.id === u.id)),
        );
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedUsers],
  );

  const toggleUser = (user: any) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    setIsSharing(true);

    try {
      if (activeTab === 'internal') {
        if (selectedUsers.length === 0) return;

        await Promise.all(
          selectedUsers.map(user => {
            if (item.isFolder) {
              return fileService.shareFolder(
                item.id,
                user.email,
                internalPermission,
              );
            } else {
              return fileService.shareFile(
                item.id,
                user.email,
                internalPermission,
              );
            }
          }),
        );
      } else {
        const expiresInSeconds = expiryDays
          ? parseInt(expiryDays) * 24 * 3600
          : undefined;
        let result;
        if (item.isFolder) {
          result = await fileService.shareFolder(
            item.id,
            undefined,
            externalPermission as any,
            expiresInSeconds,
          );
        } else {
          result = await fileService.shareFile(
            item.id,
            undefined,
            externalPermission as any,
            expiresInSeconds,
          );
        }

        // Result contains the link, but since we are in a modal, we might want to show it?
        // For now, let's just close and assume success.
      }

      onShareSuccess?.();
      onClose();
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={`Share ${item?.isFolder ? 'Folder' : 'File'}`}
      description={item?.name}
    >
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'internal' && styles.activeTab]}
            onPress={() => setActiveTab('internal')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'internal' && styles.activeTabText,
              ]}
            >
              Internal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'external' && styles.activeTab]}
            onPress={() => setActiveTab('external')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'external' && styles.activeTabText,
              ]}
            >
              Public Link
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'internal' ? (
          <View style={styles.content}>
            <Text style={styles.label}>Add Users</Text>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <View style={styles.chipsContainer}>
                {selectedUsers.map(user => (
                  <View key={user.id} style={styles.chip}>
                    <Text style={styles.chipText}>{user.email}</Text>
                    <TouchableOpacity onPress={() => toggleUser(user)}>
                      <MaterialIcons name="close" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color="#64748B"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Search by email..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={Colors.purple.vibrant} />
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {searchResults.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.resultItem}
                    onPress={() => toggleUser(user)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user.email[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.resultEmail}>{user.email}</Text>
                      <Text style={styles.resultName}>
                        {user.firstName} {user.lastName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Permission</Text>
            <View style={styles.permissionContainer}>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  internalPermission === 'VIEW' && styles.permissionBtnActive,
                ]}
                onPress={() => setInternalPermission('VIEW')}
              >
                <MaterialIcons
                  name="visibility"
                  size={20}
                  color={internalPermission === 'VIEW' ? '#FFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.permissionBtnText,
                    internalPermission === 'VIEW' &&
                      styles.permissionBtnTextActive,
                  ]}
                >
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  internalPermission === 'EDIT' && styles.permissionBtnActive,
                ]}
                onPress={() => setInternalPermission('EDIT')}
              >
                <MaterialIcons
                  name="edit"
                  size={20}
                  color={internalPermission === 'EDIT' ? '#FFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.permissionBtnText,
                    internalPermission === 'EDIT' &&
                      styles.permissionBtnTextActive,
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.label}>Public Access</Text>
            <View style={styles.permissionContainer}>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  externalPermission === 'VIEW' && styles.permissionBtnActive,
                ]}
                onPress={() => setExternalPermission('VIEW')}
              >
                <Text
                  style={[
                    styles.permissionBtnText,
                    externalPermission === 'VIEW' &&
                      styles.permissionBtnTextActive,
                  ]}
                >
                  View Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.permissionBtn,
                  externalPermission === 'DOWNLOAD' &&
                    styles.permissionBtnActive,
                ]}
                onPress={() => setExternalPermission('DOWNLOAD')}
              >
                <Text
                  style={[
                    styles.permissionBtnText,
                    externalPermission === 'DOWNLOAD' &&
                      styles.permissionBtnTextActive,
                  ]}
                >
                  Download
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Expiry (Days - optional)</Text>
            <TextInput
              style={styles.inputBorder}
              placeholder="e.g. 7"
              value={expiryDays}
              onChangeText={setExpiryDays}
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.shareBtn,
            activeTab === 'internal' &&
              selectedUsers.length === 0 &&
              styles.shareBtnDisabled,
          ]}
          onPress={handleShare}
          disabled={
            isSharing ||
            (activeTab === 'internal' && selectedUsers.length === 0)
          }
        >
          {isSharing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialIcons
                name="share"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.shareBtnText}>
                Share {activeTab === 'internal' ? 'with users' : 'via link'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: Colors.purple.vibrant,
  },
  content: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1E293B',
  },
  inputBorder: {
    height: 44,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    color: Colors.purple.vibrant,
    marginRight: 4,
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.purple.vibrant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  resultName: {
    fontSize: 12,
    color: '#64748B',
  },
  permissionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  permissionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  permissionBtnActive: {
    backgroundColor: Colors.purple.vibrant,
    borderColor: Colors.purple.vibrant,
  },
  permissionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  permissionBtnTextActive: {
    color: '#FFF',
  },
  shareBtn: {
    backgroundColor: Colors.purple.vibrant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShareModal;
