package com.v8idcloud.core.data.storage

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.v8idcloud.core.common.Constants
import com.v8idcloud.core.common.security.CryptoManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

// Extension property for DataStore
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = Constants.PREFS_NAME)

/**
 * Storage Manager
 * Equivalent to AsyncStorage in React Native
 * Uses DataStore for secure, type-safe storage
 */
@Singleton
class StorageManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val cryptoManager: CryptoManager
) {
    private val dataStore = context.dataStore

    // Preference Keys
    companion object {
        val ACCESS_TOKEN = stringPreferencesKey(Constants.KEY_ACCESS_TOKEN)
        val REFRESH_TOKEN = stringPreferencesKey(Constants.KEY_REFRESH_TOKEN)
        val USER_ID = stringPreferencesKey(Constants.KEY_USER_ID)
        val SESSION_ID = stringPreferencesKey("session_id")
        val TEMP_TOKEN = stringPreferencesKey("temp_token")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val USER_FIRST_NAME = stringPreferencesKey("user_first_name")
        val USER_LAST_NAME = stringPreferencesKey("user_last_name")
        val USER_AVATAR_URL = stringPreferencesKey("user_avatar_url")
        val REMEMBER_ME = booleanPreferencesKey("remember_me")
    }

    // ============ TOKEN OPERATIONS ============

    suspend fun saveAccessToken(token: String) {
        val encrypted = cryptoManager.encrypt(token)
        dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN] = encrypted
        }
    }

    fun getAccessToken(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[ACCESS_TOKEN]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getAccessTokenSync(): String? = getAccessToken().first()

    suspend fun saveRefreshToken(token: String) {
        val encrypted = cryptoManager.encrypt(token)
        dataStore.edit { preferences ->
            preferences[REFRESH_TOKEN] = encrypted
        }
    }

    fun getRefreshToken(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[REFRESH_TOKEN]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getRefreshTokenSync(): String? = getRefreshToken().first()

    suspend fun saveSessionId(sessionId: String) {
        val encrypted = cryptoManager.encrypt(sessionId)
        dataStore.edit { preferences ->
            preferences[SESSION_ID] = encrypted
        }
    }

    suspend fun getSessionIdSync(): String? = dataStore.data
        .map { preferences -> preferences[SESSION_ID]?.let { cryptoManager.decrypt(it) } }
        .first()

    suspend fun saveTempToken(token: String) {
        val encrypted = cryptoManager.encrypt(token)
        dataStore.edit { preferences ->
            preferences[TEMP_TOKEN] = encrypted
        }
    }

    suspend fun getTempTokenSync(): String? = dataStore.data
        .map { preferences -> preferences[TEMP_TOKEN]?.let { cryptoManager.decrypt(it) } }
        .first()

    suspend fun clearTempToken() {
        dataStore.edit { preferences ->
            preferences.remove(TEMP_TOKEN)
        }
    }

    // ============ USER OPERATIONS ============

    suspend fun saveUserId(userId: String) {
        val encrypted = cryptoManager.encrypt(userId)
        dataStore.edit { preferences ->
            preferences[USER_ID] = encrypted
        }
    }

    fun getUserId(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_ID]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun saveUserEmail(email: String) {
        val encrypted = cryptoManager.encrypt(email)
        dataStore.edit { preferences ->
            preferences[USER_EMAIL] = encrypted
        }
    }

    fun getUserEmail(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_EMAIL]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getUserEmailSync(): String? = getUserEmail().first()

    fun getUserFirstName(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_FIRST_NAME]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getUserFirstNameSync(): String? = getUserFirstName().first()

    fun getUserLastName(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_LAST_NAME]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getUserLastNameSync(): String? = getUserLastName().first()

    fun getUserAvatarUrl(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_AVATAR_URL]?.let { cryptoManager.decrypt(it) }
    }

    suspend fun getUserAvatarUrlSync(): String? = getUserAvatarUrl().first()

    suspend fun saveUserFirstName(firstName: String?) {
        dataStore.edit { preferences ->
            if (firstName != null) {
                preferences[USER_FIRST_NAME] = cryptoManager.encrypt(firstName)
            } else {
                preferences.remove(USER_FIRST_NAME)
            }
        }
    }

    suspend fun saveUserLastName(lastName: String?) {
        dataStore.edit { preferences ->
            if (lastName != null) {
                preferences[USER_LAST_NAME] = cryptoManager.encrypt(lastName)
            } else {
                preferences.remove(USER_LAST_NAME)
            }
        }
    }

    suspend fun saveUserAvatarUrl(avatarUrl: String?) {
        dataStore.edit { preferences ->
            if (avatarUrl != null) {
                preferences[USER_AVATAR_URL] = cryptoManager.encrypt(avatarUrl)
            } else {
                preferences.remove(USER_AVATAR_URL)
            }
        }
    }

    suspend fun saveUserInfo(userId: String, email: String, firstName: String?, lastName: String?, avatarUrl: String? = null) {
        dataStore.edit { preferences ->
            preferences[USER_ID] = cryptoManager.encrypt(userId)
            preferences[USER_EMAIL] = cryptoManager.encrypt(email)
            firstName?.let { preferences[USER_FIRST_NAME] = cryptoManager.encrypt(it) }
            lastName?.let { preferences[USER_LAST_NAME] = cryptoManager.encrypt(it) }
            avatarUrl?.let { preferences[USER_AVATAR_URL] = cryptoManager.encrypt(it) }
        }
    }

    // ============ CLEAR OPERATIONS ============

    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }

    suspend fun clearAuthData() {
        dataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN)
            preferences.remove(REFRESH_TOKEN)
            preferences.remove(SESSION_ID)
            preferences.remove(USER_ID)
            preferences.remove(USER_EMAIL)
            preferences.remove(USER_FIRST_NAME)
            preferences.remove(USER_LAST_NAME)
            preferences.remove(USER_AVATAR_URL)
        }
    }
}
