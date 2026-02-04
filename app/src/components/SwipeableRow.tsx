import React, { useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../theme/colors';

export interface SwipeAction {
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  isRevealed: boolean;
  onToggle: (revealed: boolean) => void;
  height?: number;
}

const MENU_WIDTH = 180; // Enough space for 3 circular buttons
const ACTION_SIZE = 44;

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  actions,
  isRevealed,
  onToggle,
  height = 74,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  // Sync animation with revealed state from parent
  useEffect(() => {
    const toValue = isRevealed ? -MENU_WIDTH : 0;
    lastOffset.current = toValue;
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
      // Bounce effect similar to iOS
    }).start();
  }, [isRevealed, animatedValue]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
          );
        },
        onPanResponderGrant: () => {
          animatedValue.setOffset(lastOffset.current);
          animatedValue.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          let val = gestureState.dx;
          const total = lastOffset.current + val;

          // Limit drag
          if (total < -MENU_WIDTH - 50) {
            // Resistance beyond max open
            val =
              -MENU_WIDTH -
              50 -
              lastOffset.current +
              (total + MENU_WIDTH + 50) * 0.2;
          } else if (total > 0) {
            // Resistance beyond closed
            val = -lastOffset.current + total * 0.2;
          }

          animatedValue.setValue(val);
        },
        onPanResponderRelease: (_, gestureState) => {
          animatedValue.flattenOffset();
          const currentPos = lastOffset.current + gestureState.dx;
          const velocityX = gestureState.vx;

          let shouldOpen = false;
          if (velocityX < -0.5) shouldOpen = true; // Fast swipe left
          else if (velocityX > 0.5) shouldOpen = false; // Fast swipe right
          else shouldOpen = currentPos < -MENU_WIDTH / 2; // Dragged past half

          if (shouldOpen) {
            onToggle(true);
          } else {
            onToggle(false);
          }
        },
        onPanResponderTerminate: () => {
          animatedValue.flattenOffset();
          onToggle(false);
        },
      }),
    [onToggle, animatedValue],
  );

  return (
    <View style={[styles.container, { height }]}>
      {/* Background Actions */}
      <View style={[styles.actionsContainer, { width: MENU_WIDTH }]}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor },
            ]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name={action.icon} size={22} color={action.color} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Foreground Content */}
      <Animated.View
        style={[
          styles.foregroundContainer,
          {
            transform: [{ translateX: animatedValue }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    gap: 12, // Space between circles
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  foregroundContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
