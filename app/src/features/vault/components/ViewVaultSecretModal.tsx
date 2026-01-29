import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../theme/colors';
import vaultService, { VaultSecret } from '../../../services/api/vaultService';

interface ViewVaultSecretModalProps {
  visible: boolean;
  secretId: string | null;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

const ViewVaultSecretModal = ({
  visible,
  secretId,
  onClose,
  onDeleteSuccess,
}: ViewVaultSecretModalProps) => {
  const [secret, setSecret] = useState<VaultSecret | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSecret = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vaultService.getSecret(secretId!);
      setSecret(data);
    } catch (error) {
      console.error('Failed to load secret details:', error);
      Alert.alert('Error', 'Could not load credential details.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [secretId, onClose]);

  useEffect(() => {
    if (visible && secretId) {
      loadSecret();
    }
  }, [visible, secretId, loadSecret]);

  const handleCopyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Credential',
      'Are you sure you want to permanently delete this credential from your vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await vaultService.deleteSecret(secretId!);
              onDeleteSuccess();
              onClose();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete credential.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Credential Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : secret ? (
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{secret.name}</Text>
              </View>

              {secret.url && (
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Website</Text>
                  <View style={styles.row}>
                    <Text style={styles.value}>{secret.url}</Text>
                    <TouchableOpacity
                      onPress={() => handleCopyToClipboard(secret.url!, 'URL')}
                    >
                      <Icon
                        name="content-copy"
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {secret.username && (
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Username / Email</Text>
                  <View style={styles.row}>
                    <Text style={styles.value}>{secret.username}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleCopyToClipboard(secret.username!, 'Username')
                      }
                    >
                      <Icon
                        name="content-copy"
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordValue}>
                    {showPassword ? secret.password : '••••••••••••'}
                  </Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color={Colors.gray}
                        style={styles.iconMargin}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleCopyToClipboard(secret.password!, 'Password')
                      }
                    >
                      <Icon
                        name="content-copy"
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {secret.notes && (
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.notesValue}>{secret.notes}</Text>
                </View>
              )}

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color={Colors.error} />
                  ) : (
                    <>
                      <Icon
                        name="trash-can-outline"
                        size={20}
                        color={Colors.error}
                      />
                      <Text style={styles.deleteButtonText}>
                        Delete Credential
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: '60%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
  },
  centerContent: {
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  detailItem: {
    marginBottom: 25,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 17,
    color: Colors.black,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  passwordValue: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.black,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 15,
  },
  notesValue: {
    fontSize: 15,
    color: Colors.gray,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  deleteButtonText: {
    color: Colors.error,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 15,
  },
});

export default ViewVaultSecretModal;
