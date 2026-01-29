import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../theme/colors';
import vaultService, {
  AddVaultSecretDTO,
} from '../../../services/api/vaultService';
import { generateStrongPassword } from '../../../utils/passwordGenerator';

interface AddVaultSecretModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddVaultSecretModal = ({
  visible,
  onClose,
  onSuccess,
}: AddVaultSecretModalProps) => {
  const [formData, setFormData] = useState<AddVaultSecretDTO>({
    name: '',
    url: '',
    username: '',
    password: '',
    notes: '',
    category: 'GENERAL',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.password) {
      Alert.alert(
        'Required Fields',
        'Please enter at least a name and a password.',
      );
      return;
    }

    try {
      setLoading(true);
      await vaultService.addSecret(formData);
      Alert.alert('Success', 'Credential added to your secure vault.');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to add secret:', error);
      Alert.alert('Error', 'Failed to save credential. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      url: '',
      username: '',
      password: '',
      notes: '',
      category: 'GENERAL',
    });
    onClose();
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword(20);
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true); // Show the generated password so user can see it
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Credential</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Icon name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Google, Netflix"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholderTextColor={Colors.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                value={formData.url}
                onChangeText={text => setFormData({ ...formData, url: text })}
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor={Colors.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username / Email</Text>
              <TextInput
                style={styles.input}
                placeholder="johndoe@example.com"
                value={formData.username}
                onChangeText={text =>
                  setFormData({ ...formData, username: text })
                }
                autoCapitalize="none"
                placeholderTextColor={Colors.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password *</Text>
                <TouchableOpacity onPress={handleGeneratePassword}>
                  <Text style={styles.generateText}>
                    Generate Strong Password
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  value={formData.password}
                  onChangeText={text =>
                    setFormData({ ...formData, password: text })
                  }
                  secureTextEntry={!showPassword}
                  placeholderTextColor={Colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional info..."
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.gray}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Securely Save</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    height: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.black,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  generateText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AddVaultSecretModal;
