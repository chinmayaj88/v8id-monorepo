import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import HomeScreen from '../features/home/screens/HomeScreen';
import ProfileScreen from '../features/user/screens/ProfileScreen';
import FolderScreen from '../features/home/screens/FolderScreen';
import VaultScreen from '../features/vault/screens/VaultScreen';
import { Colors } from '../theme/colors';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUploadMenuVisible } from '../store/uiSlice';
import UploadMenu from '../features/home/components/UploadMenu';

const Placeholder = ({ name }: { name: string }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FAFAFA',
    }}
  >
    <Text style={{ fontSize: 18, color: '#333' }}>{name} Screen</Text>
  </View>
);

export type TabParamList = {
  Home: undefined;
  Files: undefined;
  Vault: undefined;
  Profile: undefined;
  Media: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabButton = ({ route, state, descriptors, navigation, icon }: any) => {
  const { options } = descriptors[route.key];
  const isFocused = state.routes[state.index].key === route.key;

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
    >
      <View style={[styles.iconCircle, isFocused && styles.iconCircleSelected]}>
        <Icon
          name={icon}
          size={24}
          color={isFocused ? Colors.black : 'rgba(255,255,255,0.6)'}
        />
      </View>
    </TouchableOpacity>
  );
};

const CustomTabBarV2 = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const dispatch = useAppDispatch();
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.capsule}>
        <TabButton
          route={state.routes[0]}
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          icon="home"
        />
        <TabButton
          route={state.routes[1]}
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          icon="folder-outline"
        />

        <View style={{ width: 60 }} />

        <TabButton
          route={state.routes[2]}
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          icon="shield-lock-outline"
        />
        <TabButton
          route={state.routes[3]}
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          icon="account-outline"
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => dispatch(setUploadMenuVisible(true))}
        activeOpacity={0.9}
      >
        <Icon name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const TabNavigator = () => {
  const dispatch = useAppDispatch();
  const { uploadMenuVisible, currentFolderId } = useAppSelector(
    state => state.ui,
  );

  return (
    <>
      <Tab.Navigator
        tabBar={props => <CustomTabBarV2 {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Files" component={FolderScreen} />
        <Tab.Screen name="Vault" component={VaultScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <UploadMenu
        visible={uploadMenuVisible}
        onClose={() => dispatch(setUploadMenuVisible(false))}
        folderId={currentFolderId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  capsule: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    borderRadius: 40,
    height: 72,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    width: 50,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  iconCircleSelected: {
    backgroundColor: Colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    top: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D6AFA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2D6AFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
});

export default TabNavigator;
