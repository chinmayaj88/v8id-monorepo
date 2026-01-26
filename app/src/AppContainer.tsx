import React from 'react';
import {
  View,
  StatusBar,
  useColorScheme,
  StyleSheet,
  Text,
} from 'react-native';
import { useAppDispatch } from './store/hooks';
import { initializeAuth } from './features/auth/store/authSlice';
import RootNavigator from './navigation';
import { Colors } from './theme/colors';

const AppContainer = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

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
