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
import { Colors } from '../../../theme/colors';

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
      Animated.loop(
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
      ).start();
    };

    createAnim(orb1Anim, 0.15, 0.3, 3000);
    createAnim(orb2Anim, 0.1, 0.25, 4000);
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

const TotpCodeInputField = ({ code, onCodeChange, isFocused }: any) => {
  return (
    <View
      style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
    >
      <View style={styles.codeRow}>
        {Array(6)
          .fill(0)
          .map((_, index) => {
            const char = code[index] || '';
            const isFilled = char !== '';
            const isCurrent = index === code.length && isFocused;

            return (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  isFilled && styles.codeBoxFilled,
                  isCurrent && styles.codeBoxCurrent,
                ]}
              >
                {isFilled ? (
                  <Text style={styles.codeChar}>{char}</Text>
                ) : isCurrent ? (
                  <View style={styles.cursor} />
                ) : null}
              </View>
            );
          })}
      </View>
    </View>
  );
};

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { verifyTotp, clearError } from '../store/authSlice';
import ErrorBanner from '../../../components/ErrorBanner';

// ... (other imports)

const TotpScreen = ({ navigation, route }: any) => {
  const { email } = route.params || {};
  const dispatch = useAppDispatch();
  const { isLoading, error, tempToken } = useAppSelector(state => state.auth);

  const [totpCode, setTotpCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (totpCode.length === 6) {
      handleVerify();
    }
  }, [totpCode]);

  const handleVerify = async () => {
    if (!tempToken) {
      console.error('No tempToken available for TOTP verification');
      return;
    }

    const result = await dispatch(verifyTotp({ tempToken, totpCode }));
    // success handled in Redux by setting isAuthenticated = true
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ErrorBanner message={error} onDismiss={() => dispatch(clearError())} />

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

              <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
              <Text style={styles.cardSubtitle}>
                Enter the 6-digit code from your authenticator app
              </Text>

              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.inputArea}
              >
                <TotpCodeInputField code={totpCode} isFocused={isFocused} />
                <TextInput
                  ref={inputRef}
                  style={styles.hiddenInput}
                  value={totpCode}
                  onChangeText={val => {
                    if (val.length <= 6 && /^\d*$/.test(val)) {
                      setTotpCode(val);
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (totpCode.length < 6 || isLoading) && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={totpCode.length < 6 || isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>
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
  },
  orb2: {
    width: 350,
    height: 350,
    backgroundColor: Colors.purple.indigo,
    bottom: 100,
    right: -40,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: Colors.purple.deep,
    fontWeight: '500',
    marginLeft: 4,
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
    marginBottom: 32,
  },
  inputArea: {
    marginBottom: 24,
  },
  inputWrapper: {
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.purple.subtleTint,
    borderWidth: 1,
    borderColor: Colors.purple.veryLight,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: Colors.purple.vibrantAlt,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBox: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.purple.veryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.purple.veryLight,
  },
  codeBoxFilled: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  codeBoxCurrent: {
    borderColor: Colors.purple.vibrantAlt,
    borderWidth: 2,
  },
  codeChar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.purple.darkNavy,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: Colors.purple.vibrantAlt,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
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
});

export default TotpScreen;
