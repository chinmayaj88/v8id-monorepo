import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ActiveSessionsScreen from '../features/user/screens/ActiveSessionsScreen';
import { View, Text } from 'react-native';

import NotificationScreen from '../features/home/screens/NotificationScreen';
import FileViewerScreen from '../features/home/screens/FileViewerScreen';
import FolderScreen from '../features/home/screens/FolderScreen';

const Stack = createNativeStackNavigator();

// Placeholders for other screens
const StorageScreen = () => (
  <View>
    <Text>Storage</Text>
  </View>
);

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
      <Stack.Screen name="Viewer" component={FileViewerScreen} />
      <Stack.Screen name="Folders" component={FolderScreen} />
      <Stack.Screen name="Storage" component={StorageScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
