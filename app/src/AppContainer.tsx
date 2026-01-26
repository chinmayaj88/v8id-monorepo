import React from 'react';
import {
  View,
  StatusBar,
  useColorScheme,
  StyleSheet,
  Text,
} from 'react-native';
import RootNavigator from './navigation';
import { Colors } from './theme/colors';

const AppContainer = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default AppContainer;
