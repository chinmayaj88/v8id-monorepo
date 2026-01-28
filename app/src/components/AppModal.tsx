import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../theme/colors';

interface Action {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

interface AppModalProps {
  visible: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'danger' | 'success' | 'info';
  actions?: Action[];
  children?: React.ReactNode;
}

const { width } = Dimensions.get('window');

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  description,
  icon,
  variant = 'default',
  actions = [],
  children,
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return Colors.error;
      case 'success':
        return Colors.success;
      case 'info':
        return Colors.secondary;
      default:
        return Colors.primary;
    }
  };

  const getButtonStyles = (btnVariant: Action['variant'] = 'primary') => {
    switch (btnVariant) {
      case 'danger':
        return {
          bg: Colors.error,
          text: Colors.white,
          border: Colors.error,
        };
      case 'secondary':
        return {
          bg: '#F1F5F9',
          text: Colors.black,
          border: '#F1F5F9',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: Colors.gray,
          border: Colors.border,
        };
      default:
        return {
          bg: Colors.primary,
          text: Colors.white,
          border: Colors.primary,
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose} // Optional: close on backdrop click
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            {/* Header Icon */}
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${getIconColor()}15` }, // 15 = roughly 8% opacity in hex? Wait, 15/255 fits better as hex string suffix if color is hex
                ]}
              >
                <MaterialIcons name={icon} size={32} color={getIconColor()} />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {description && (
                <Text style={styles.description}>{description}</Text>
              )}
              {children}
            </View>

            {/* Actions */}
            {actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => {
                  const stylesForBtn = getButtonStyles(action.variant);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        {
                          backgroundColor: stylesForBtn.bg,
                          borderColor: stylesForBtn.border,
                          // If there are 2 actions, make them sit side-by-side
                          flex: actions.length > 1 ? 1 : undefined,
                          marginLeft: index > 0 ? 12 : 0,
                        },
                      ]}
                      onPress={action.onPress}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: stylesForBtn.text },
                        ]}
                      >
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 100,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppModal;
