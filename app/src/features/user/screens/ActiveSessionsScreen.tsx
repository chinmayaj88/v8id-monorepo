import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../theme';
import { useNavigation } from '@react-navigation/native';
import { userService, DeviceSession } from '../../../services/api/userService';
import AppModal from '../../../components/AppModal';
import { useAppDispatch } from '../../../store/hooks';
import { logoutUser } from '../../auth/store/authSlice';

const ActiveSessionsScreen = () => {
  // Screen to manage active device sessions
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    description?: string;
    variant?: 'default' | 'danger' | 'success';
    icon?: string;
    actions: { text: string; onPress: () => void; variant?: any }[];
  }>({
    visible: false,
    title: '',
    actions: [],
  });

  const showModal = (config: Partial<typeof modalConfig>) => {
    setModalConfig({
      visible: true,
      title: config.title || '',
      description: config.description,
      variant: config.variant || 'default',
      icon: config.icon,
      actions: config.actions || [{ text: 'OK', onPress: () => closeModal() }],
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
      showModal({
        title: 'Error',
        description: 'Failed to load active sessions.',
        variant: 'danger',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = (session: DeviceSession) => {
    const isCurrent = session.isCurrent;
    const description = isCurrent
      ? 'This is your current session. Revoking it will log you out immediately. Are you sure?'
      : 'Are you sure you want to log out this device?';

    showModal({
      title: 'Revoke Session',
      description,
      variant: 'danger',
      icon: 'warning',
      actions: [
        { text: 'Cancel', onPress: closeModal, variant: 'secondary' },
        {
          text: isCurrent ? 'Log Out' : 'Revoke',
          variant: 'danger',
          onPress: async () => {
            closeModal();
            try {
              await userService.revokeSession(session.id);
              if (isCurrent) {
                dispatch(logoutUser());
              } else {
                setSessions(prev => prev.filter(s => s.id !== session.id));
              }
            } catch (error) {
              console.error(error);
              showModal({
                title: 'Error',
                description: 'Failed to revoke session.',
                variant: 'danger',
                icon: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleRevokeAll = () => {
    showModal({
      title: 'Revoke All Sessions',
      description: 'Are you sure you want to log out of all other devices?',
      variant: 'danger',
      icon: 'warning',
      actions: [
        { text: 'Cancel', onPress: closeModal, variant: 'secondary' },
        {
          text: 'Revoke All',
          variant: 'danger',
          onPress: async () => {
            closeModal();
            try {
              await userService.revokeAllSessions();
              loadSessions();

              setTimeout(() => {
                showModal({
                  title: 'Success',
                  description: 'All other sessions have been revoked.',
                  variant: 'success',
                  icon: 'check-circle',
                });
              }, 500);
            } catch (error) {
              console.error(error);
              showModal({
                title: 'Error',
                description: 'Failed to revoke all sessions.',
                variant: 'danger',
                icon: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const renderSessionItem = ({ item }: { item: DeviceSession }) => {
    const isMobile = item.deviceType === 'MOBILE';
    const iconName = isMobile ? 'smartphone' : 'computer';

    return (
      <View
        style={[
          styles.sessionCard,
          item.isCurrent && styles.currentSessionCard,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            item.isCurrent && styles.currentIconContainer,
          ]}
        >
          <MaterialIcons
            name={iconName}
            size={28}
            color={item.isCurrent ? Colors.purple.vibrant : Colors.primary}
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.deviceName}>
            {item.deviceName || 'Unknown Device'}
            {item.isCurrent && (
              <Text style={styles.currentBadge}> (Current)</Text>
            )}
          </Text>
          <Text style={styles.sessionDetail}>
            {item.location || item.ipAddress || 'Unknown Location'}
          </Text>
          <Text style={styles.sessionTime}>
            {item.isCurrent
              ? 'Active now'
              : `Last active: ${new Date(item.lastActiveAt).toLocaleString()}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => handleRevoke(item)}
        >
          <MaterialIcons
            name={item.isCurrent ? 'logout' : 'delete-outline'}
            size={24}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <MaterialIcons name="arrow-back" size={20} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Active Sessions</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="devices" size={64} color={Colors.gray} />
            <Text style={styles.emptyText}>No active sessions found.</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={loadSessions} />
            }
          />
        )}
      </View>

      {/* Revoke All Button */}
      {sessions.length > 1 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.revokeAllButton}
            onPress={handleRevokeAll}
          >
            <Text style={styles.revokeAllText}>Revoke All Other Sessions</Text>
          </TouchableOpacity>
        </View>
      )}

      <AppModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        icon={modalConfig.icon}
        actions={modalConfig.actions}
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
    padding: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  currentSessionCard: {
    borderColor: Colors.purple.subtleTint,
    backgroundColor: '#FAF5FF', // Very light purple
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF', // Light purple bg
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentIconContainer: {
    backgroundColor: '#F3E8FF',
  },
  sessionInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 4,
  },
  currentBadge: {
    color: Colors.purple.vibrant,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  sessionTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Typography.fontFamily.regular,
  },
  revokeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  revokeAllButton: {
    backgroundColor: '#FEF2F2', // Light red
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  revokeAllText: {
    color: Colors.error,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
  },
});

export default ActiveSessionsScreen;
