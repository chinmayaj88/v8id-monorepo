import * as Keychain from 'react-native-keychain';

/**
 * Secure Storage Service
 *
 * Uses react-native-keychain to store sensitive information (tokens)
 * in the device's secure hardware (Keychain for iOS, Keystore for Android).
 */
export const SecureStorage = {
  /**
   * Keys used for storage
   */
  KEYS: {
    AUTH_TOKENS: 'v8id_auth_tokens',
    USER_DATA: 'v8id_user_data',
  },

  /**
   * Save authentication tokens securely
   */
  async saveTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      const credentials = JSON.stringify({ accessToken, refreshToken });
      await Keychain.setGenericPassword('auth_session', credentials, {
        service: this.KEYS.AUTH_TOKENS,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error('🛡️ [Keychain] Failed to save tokens:', error);
      return false;
    }
  },

  /**
   * Retrieve authentication tokens securely
   */
  async getTokens(): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: this.KEYS.AUTH_TOKENS,
      });

      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.error('🛡️ [Keychain] Failed to retrieve tokens:', error);
      return null;
    }
  },

  /**
   * Securely clear all stored tokens
   */
  async clearTokens(): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({
        service: this.KEYS.AUTH_TOKENS,
      });
      return true;
    } catch (error) {
      console.error('🛡️ [Keychain] Failed to clear tokens:', error);
      return false;
    }
  },

  /**
   * (Optional) Save non-token sensitive data
   */
  async setSensitiveData(key: string, data: any): Promise<boolean> {
    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      await Keychain.setGenericPassword(key, value, {
        service: key,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  async getSensitiveData(key: string): Promise<any | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: key,
      });
      if (credentials) {
        try {
          return JSON.parse(credentials.password);
        } catch {
          return credentials.password;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },
};
