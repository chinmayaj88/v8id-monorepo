import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { login, setCredentials, clearError } from '../store/authSlice';
import ErrorBanner from '../../../components/ErrorBanner';

const { width, height } = Dimensions.get('window');

const FloatingOrbs = () => {
  const orb1Anim = useRef(new Animated.Value(0.15)).current;
  const orb2Anim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    const createAnim = (
      val: Animated.Value,
      start: number,
      to: number,
      duration: number,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: to,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: start,
            duration,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    createAnim(orb1Anim, 0.15, 0.3, 3000).start();
    createAnim(orb2Anim, 0.1, 0.25, 4000).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            opacity: orb1Anim,
            transform: [
              {
                scale: orb1Anim.interpolate({
                  inputRange: [0.15, 0.3],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            opacity: orb2Anim,
            transform: [
              {
                scale: orb2Anim.interpolate({
                  inputRange: [0.1, 0.25],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const LoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, tempToken } = useAppSelector(
    state => state.auth,
  );

  // const [email, setEmail] = useState('soumyashreesahoo25@gmail.com');
  // const [password, setPassword] = useState('Soumyashree@6370');
  const [email, setEmail] = useState('jenachinmaya51@gmail.com');
  const [password, setPassword] = useState('Chinmaya@6370');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    // If we have a tempToken, it means credentials were valid but 2FA is needed
    if (tempToken) {
      navigation.navigate('Totp', { email });
    }
    // If we are authenticated (e.g. 2FA not enabled or persistent login), RootNavigator handles this
    // but we can add a safeguard here if needed
  }, [tempToken, isAuthenticated, navigation, email]);

  const handleLogin = async () => {
    await dispatch(login({ email, password }));
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Background Image */}
      <Image
        source={require('../../../assets/images/bg1.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <FloatingOrbs />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <AntDesign name="cloud" size={42} color={Colors.white} />
              </View>
              <Text style={styles.brandText}>V8id Cloud</Text>
              <Text style={styles.brandSubtitle}>
                Secure Cloud Storage Platform
              </Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>
                Sign in to continue to your account
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.purple.light}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.purple.light}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Text style={{ color: Colors.purple.vibrantAlt }}>
                      {isPasswordVisible ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={styles.rememberMe}>
                    <Switch
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      trackColor={{
                        false: Colors.purple.veryLight,
                        true: Colors.purple.vibrantAlt,
                      }}
                      thumbColor={Colors.white}
                    />
                    <Text style={styles.rememberText}>Remember me</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    (!email || !password || isLoading) && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={!email || !password || isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing in...' : 'Log in'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.privacyText}>
                  By logging in, you agree to our updated terms and service and
                  privacy policy
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  orb: {
    position: 'absolute',
    borderRadius: 1000,
  },
  orb1: {
    width: 250,
    height: 250,
    backgroundColor: Colors.purple.light,
    top: 100,
    left: 60,
    opacity: 0.2,
    // Note: Blur would require a library or custom native module in RN
  },
  orb2: {
    width: 350,
    height: 350,
    backgroundColor: Colors.purple.indigo,
    bottom: 100,
    right: -40,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    width: 42,
    height: 42,
    tintColor: Colors.white,
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.purple.light,
    fontWeight: '300',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.purple.darkNavy,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.purple.indigo,
    marginTop: 6,
    marginBottom: 28,
  },
  form: {},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.purple.deep,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purple.subtleTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.purple.veryLight,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.purple.darkNavy,
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 12,
    color: Colors.purple.deep,
    marginLeft: 8,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.purple.indigo,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.purple.vibrant,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.purple.vibrant,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.purple.veryLight,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 10,
    color: Colors.purple.indigo,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 14,
  },
});

export default LoginScreen;
