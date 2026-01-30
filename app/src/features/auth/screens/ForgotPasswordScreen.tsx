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
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { forgotPassword, clearError } from '../store/authSlice';

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

const ForgotPasswordScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    const result = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(result)) {
      setIsSuccess(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

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
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <AntDesign name="cloud" size={42} color={Colors.white} />
              </View>
              <Text style={styles.brandText}>V8id Cloud</Text>
              <Text style={styles.brandSubtitle}>
                Secure Cloud Storage Platform
              </Text>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons
                  name="arrow-back-ios-new"
                  size={20}
                  color={Colors.purple.deep}
                />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {isSuccess ? (
                <View style={styles.successContent}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.cardTitle}>Check your email</Text>
                  <Text style={styles.cardSubtitle}>
                    If an account with that email exists, a password reset link
                    has been sent.
                  </Text>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.loginButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.cardTitle}>Forgot Password?</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your email address and we'll send you a link to reset
                    your password
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
                        keyboardType="email-address"
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (!email || isLoading) && styles.buttonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={!email || isLoading}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    fontFamily: Typography.fontFamily.bold,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: Colors.purple.deep,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 26,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple.darkNavy,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.purple.indigo,
    marginTop: 6,
    marginBottom: 28,
    fontFamily: Typography.fontFamily.regular,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: Colors.success,
    marginBottom: 24,
  },
  form: {},
  label: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.purple.darkNavy,
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
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: Colors.purple.veryLight,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
});

export default ForgotPasswordScreen;
