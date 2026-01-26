import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../theme/colors';
import { useAppDispatch } from '../../../store/hooks';
import { setCredentials } from '../store/authSlice';

const LoginScreen = () => {
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    // Mock user login for testing navigation
    dispatch(
      setCredentials({
        user: {
          id: '1',
          email: 'test@v8id.com',
          isTwoFactorEnabled: false,
        },
        token: 'mock-token',
      }),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>V8ID</Text>
          <Text style={styles.subtitleText}>Secure Identity Management</Text>
        </View>

        <View style={styles.centerContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>App is working correctly</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 1.5,
  },
  statusText: {
    marginTop: 20,
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;
