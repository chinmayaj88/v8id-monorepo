import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Typography } from '../../../theme';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { userService } from '../../../services/api/userService';
import Clipboard from '@react-native-clipboard/clipboard';

interface AddUserSheetProps {
  visible: boolean;
  onClose: () => void;
}

const AddUserSheet = ({ visible, onClose }: AddUserSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    storageQuota: '10737418240', // 10GB default
    role: 'USER',
  });
  const [createdUser, setCreatedUser] = useState<any>(null);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      storageQuota: '10737418240',
      role: 'USER',
    });
    setStep('form');
    setCreatedUser(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.firstName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        storageQuota: Number(formData.storageQuota),
      };
      const response = await userService.createUser(payload);
      setCreatedUser(response.data);
      setStep('success');
    } catch (error: any) {
      console.error('Create user error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create user',
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Copied to clipboard');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'form' ? 'Add New User' : 'User Created!'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 'form' ? (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChangeText={t =>
                      setFormData({ ...formData, firstName: t })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChangeText={t =>
                      setFormData({ ...formData, lastName: t })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChangeText={t => setFormData({ ...formData, email: t })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    value={formData.password}
                    onChangeText={t =>
                      setFormData({ ...formData, password: t })
                    }
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Storage Quota (GB)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter storage limit in GB"
                    value={(
                      Number(formData.storageQuota) /
                      (1024 * 1024 * 1024)
                    ).toString()}
                    onChangeText={t => {
                      const gb = parseFloat(t);
                      if (!isNaN(gb)) {
                        setFormData({
                          ...formData,
                          storageQuota: (gb * 1024 * 1024 * 1024).toString(),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          storageQuota: '0',
                        });
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Role</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'USER' && styles.roleButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, role: 'USER' })}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          formData.role === 'USER' && styles.roleTextActive,
                        ]}
                      >
                        User
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'ADMIN' && styles.roleButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, role: 'ADMIN' })
                      }
                    >
                      <Text
                        style={[
                          styles.roleText,
                          formData.role === 'ADMIN' && styles.roleTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create User</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successHeader}>
                  <MaterialIcons
                    name="check-circle"
                    size={48}
                    color={Colors.success}
                  />
                  <Text style={styles.successTitle}>
                    {createdUser?.firstName} has been added!
                  </Text>
                  <Text style={styles.successSubtitle}>
                    Please have the user scan this QR code immediately to set up
                    2FA.
                  </Text>
                </View>

                {createdUser?.totpSetup?.qrCodeUrl && (
                  <View style={styles.qrContainer}>
                    <Image
                      source={{ uri: createdUser.totpSetup.qrCodeUrl }}
                      style={{ width: 200, height: 200 }}
                    />
                  </View>
                )}

                <View style={styles.secretContainer}>
                  <Text style={styles.secretLabel}>Manual Secret Key:</Text>
                  <TouchableOpacity
                    style={styles.copyRow}
                    onPress={() =>
                      copyToClipboard(createdUser?.totpSetup?.secret || '')
                    }
                  >
                    <Text style={styles.secretText}>
                      {createdUser?.totpSetup?.secret}
                    </Text>
                    <MaterialIcons
                      name="content-copy"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.backupCodesContainer}>
                  <Text style={styles.secretLabel}>
                    Backup Codes (Save these!):
                  </Text>
                  <View style={styles.codesGrid}>
                    {createdUser?.totpSetup?.backupCodes?.map(
                      (code: string, index: number) => (
                        <Text key={index} style={styles.backupCode}>
                          {code}
                        </Text>
                      ),
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleClose}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    backgroundColor: '#FAFAFA',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  roleText: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray,
  },
  roleTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  successContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginTop: 12,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 24,
  },
  secretContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  secretLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 8,
    fontFamily: Typography.fontFamily.medium,
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secretText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.black,
    letterSpacing: 1,
  },
  backupCodesContainer: {
    width: '100%',
    marginBottom: 32,
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCode: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    color: Colors.gray,
  },
  doneButton: {
    width: '100%',
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default AddUserSheet;
