import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, Typography } from '../theme';

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
  badge?: string; // Kept for backward compatibility
  label?: string; // New prop name from Gxx
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  description,
  variant = 'default',
  actions = [],
  children,
  badge,
  label,
}) => {
  // Prefer label, fallback to badge, fallback to generic
  const displayLabel = label || badge || 'DETAILS';

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
        // Primary
        return {
          bg: Colors.primary, // Purple
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
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            {/* Curved Notch Section */}
            <View style={styles.notchContainer}>
              <Text style={styles.notchText}>{displayLabel}</Text>
            </View>

            {/* Close Button - positioned on the opposite right end */}
            {onClose && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={20} color={Colors.black} />
              </TouchableOpacity>
            )}

            {/* Main Content Section */}
            <View style={styles.bodyContainer}>
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
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: Colors.black, // Dark backing for "shadow" effect
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  notchContainer: {
    backgroundColor: Colors.white, // White notch to match body
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 160,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 60, // The unique curve
  },
  notchText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Subtle light bg on the black container
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bodyContainer: {
    backgroundColor: Colors.white, // White body
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    width: '100%',
    // Match logic: if notch is 'behind', body sits on top?
    // In Gxx, notch was first child in column. Body was second.
    // They share same bg color to look merged.
  },
  content: {
    width: '100%',
    // alignItems: 'center', // Depending on preference, center or left. Gxx 'quiz' was left, default center.
    // Let's keep it somewhat flexible. Center usually looks better for modals.
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 100,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default AppModal;
