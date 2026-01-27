import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateUserProfile } from '../../auth/store/authSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_URL } from '@env';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(state => state.auth);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);

      if (avatarFile) {
        formData.append('avatar', {
          uri: avatarFile.uri,
          type: avatarFile.type,
          name: avatarFile.fileName,
        } as any);
      }

      await dispatch(updateUserProfile(formData)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri || null);
      setAvatarFile(asset);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickImage}
            >
              {avatarUri || user?.avatarUrl ? (
                <Image
                  source={{
                    uri: avatarUri
                      ? avatarUri
                      : user?.avatarUrl?.startsWith('http')
                      ? user.avatarUrl
                      : `${API_URL.replace('/api', '')}${user?.avatarUrl}`,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <MaterialIcons name="person" size={40} color={Colors.gray} />
                </View>
              )}
              <View style={styles.editIconBadge}>
                <MaterialIcons name="edit" size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  content: {
    padding: 24,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.purple.vibrant,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: Colors.purple.vibrant,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditProfileSheet;
