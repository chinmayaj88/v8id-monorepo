import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ActiveSessionsScreen from '../features/user/screens/ActiveSessionsScreen';
import { View, Text } from 'react-native';

import NotificationScreen from '../features/home/screens/NotificationScreen';

const Stack = createNativeStackNavigator();

// Placeholders for other screens
const ViewerScreen = () => (
  <View>
    <Text>Viewer</Text>
  </View>
);
const FoldersScreen = () => (
  <View>
    <Text>Folders</Text>
  </View>
);
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
      <Stack.Screen name="Viewer" component={ViewerScreen} />
      <Stack.Screen name="Folders" component={FoldersScreen} />
      <Stack.Screen name="Storage" component={StorageScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
