import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../../theme/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import { uploadManager } from '../services/UploadManager';
import fileService from '../../../services/api/fileService';
import { Alert } from 'react-native';
import AppModal from '../../../components/AppModal';
import { useState } from 'react';

interface UploadMenuProps {
  visible: boolean;
  onClose: () => void;
  folderId?: string | null;
}

const UploadMenu: React.FC<UploadMenuProps> = ({
  visible,
  onClose,
  folderId,
}) => {
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const handlePickMedia = async () => {
    onClose();
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 0,
      });

      if (result.assets && result.assets.length > 0) {
        const files = result.assets.map((asset: any) => ({
          uri: asset.uri!,
          name: asset.fileName || `file_${Date.now()}`,
          mimeType: asset.type || 'application/octet-stream',
          size: asset.fileSize || 0,
        }));
        uploadManager.enqueue(files, folderId);
      }
    } catch (err) {
      console.error('ImagePicker Error: ', err);
    }
  };

  const handleBrowse = async () => {
    onClose();
    try {
      const results = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });

      const files = results.map((file: any) => ({
        uri: file.uri,
        name: file.name || `file_${Date.now()}`,
        mimeType: file.type || 'application/octet-stream',
        size: file.size || 0,
      }));
      uploadManager.enqueue(files, folderId);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled the picker
      } else {
        console.error('DocumentPicker Error: ', err);
      }
    }
  };

  const handleCreateFolder = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const submitCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await fileService.createFolder(
        newFolderName.trim(),
        folderId || undefined,
      );
      setShowCreateFolderModal(false);
      onClose(); // Close the menu too
      // Note: FolderScreen should refresh. If we want it to refresh automatically,
      // we might need a callback or a global event.
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Upload to Cloud</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handlePickMedia}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: '#E0F2F1' }]}
                >
                  <MaterialIcons
                    name="photo-library"
                    size={24}
                    color="#009688"
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Photos & Videos</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Images and videos from gallery
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleBrowse}>
                <View
                  style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}
                >
                  <MaterialIcons name="folder-open" size={24} color="#1E88E5" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Browse</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Select files from your device
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleCreateFolder}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}
                >
                  <MaterialIcons
                    name="create-new-folder"
                    size={24}
                    color="#C2185B"
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>Folder</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Create a new folder
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      <AppModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        title="New Folder"
        icon="create-new-folder"
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowCreateFolderModal(false),
            variant: 'secondary',
          },
          {
            text: 'Create',
            onPress: submitCreateFolder,
            variant: 'primary',
          },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Folder name"
          value={newFolderName}
          onChangeText={setNewFolderName}
          autoFocus={true}
        />
      </AppModal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default UploadMenu;
