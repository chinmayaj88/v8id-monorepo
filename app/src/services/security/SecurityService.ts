import { AppState, AppStateStatus } from 'react-native';
import { store } from '../../store';
import { logoutUser } from '../../features/auth/store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './SecureStorage';

/**
 * Enterprise Security Service
 *
 * Centralizes security policies for the mobile application.
 * 1. Session Inactivity (Auto-logout)
 * 2. Background State Protection
 * 3. Secure Data Access
 */
class SecurityService {
  private lastActive: number = Date.now();
  private INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes (Enterprise Standard)
  private appState: AppStateStatus = AppState.currentState;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      this.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      this.checkSessionValidity();
    }

    if (nextAppState === 'background') {
      // Record time when app went to background
      this.lastActive = Date.now();
    }

    this.appState = nextAppState;
  };

  /**
   * Check if the session has exceeded the inactivity limit
   */
  public async checkSessionValidity() {
    const elapsed = Date.now() - this.lastActive;

    if (elapsed > this.INACTIVITY_TIMEOUT) {
      console.log('🛡️ [Security] Session timed out due to inactivity.');
      store.dispatch(logoutUser());
      return false;
    }

    // Check if device is potentially compromised (Basic Check)
    const isCompromised = await this.performEnvironmentAudit();
    if (isCompromised) {
      console.warn('🛡️ [Security] Environment compromise detected.');
      // Enforce stricter rules or logout
    }

    return true;
  }

  /**
   * Enterprise Environment Audit
   * (Placeholder logic - would use react-native-jailbreak-term in production)
   */
  private async performEnvironmentAudit(): Promise<boolean> {
    // Basic heuristics
    if (__DEV__) return false; // Allowed in development

    // In a production app, we would use native modules here to check:
    // - Check for SuperUser/Cydia paths
    // - Check for Debugger attached
    // - Check for Emulator/Simulator

    return false;
  }

  /**
   * Hardware-Backed Secure Storage Wrapper
   */
  public async getSecureItem(key: string): Promise<string | null> {
    return SecureStorage.getSensitiveData(key);
  }

  public async setSecureItem(key: string, value: string): Promise<void> {
    await SecureStorage.setSensitiveData(key, value);
  }
}

export const securityService = new SecurityService();
