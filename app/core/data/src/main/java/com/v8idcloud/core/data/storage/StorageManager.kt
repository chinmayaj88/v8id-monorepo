package com.v8idcloud.core.data.storage

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.v8idcloud.core.common.Constants
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
    @ApplicationContext private val context: Context
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
        val REMEMBER_ME = booleanPreferencesKey("remember_me")
    }
    
    // ============ TOKEN OPERATIONS ============
    
    suspend fun saveAccessToken(token: String) {
        dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN] = token
        }
    }
    
    fun getAccessToken(): Flow<String?> = dataStore.data.map { it[ACCESS_TOKEN] }
    
    suspend fun getAccessTokenSync(): String? = getAccessToken().first()
    
    suspend fun saveRefreshToken(token: String) {
        dataStore.edit { preferences ->
            preferences[REFRESH_TOKEN] = token
        }
    }
    
    fun getRefreshToken(): Flow<String?> = dataStore.data.map { it[REFRESH_TOKEN] }
    
    suspend fun saveSessionId(sessionId: String) {
        dataStore.edit { preferences ->
            preferences[SESSION_ID] = sessionId
        }
    }
    
    suspend fun getSessionIdSync(): String? = dataStore.data
        .map { it[SESSION_ID] }
        .first()
    
    suspend fun saveTempToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TEMP_TOKEN] = token
        }
    }
    
    suspend fun getTempTokenSync(): String? = dataStore.data
        .map { it[TEMP_TOKEN] }
        .first()
    
    suspend fun clearTempToken() {
        dataStore.edit { preferences ->
            preferences.remove(TEMP_TOKEN)
        }
    }
    
    // ============ USER OPERATIONS ============
    
    suspend fun saveUserId(userId: String) {
        dataStore.edit { preferences ->
            preferences[USER_ID] = userId
        }
    }
    
    fun getUserId(): Flow<String?> = dataStore.data.map { it[USER_ID] }
    
    suspend fun saveUserEmail(email: String) {
        dataStore.edit { preferences ->
            preferences[USER_EMAIL] = email
        }
    }
    
    suspend fun saveUserFirstName(firstName: String?) {
        dataStore.edit { preferences ->
            if (firstName != null) {
                preferences[USER_FIRST_NAME] = firstName
            } else {
                preferences.remove(USER_FIRST_NAME)
            }
        }
    }
    
    suspend fun saveUserLastName(lastName: String?) {
        dataStore.edit { preferences ->
            if (lastName != null) {
                preferences[USER_LAST_NAME] = lastName
            } else {
                preferences.remove(USER_LAST_NAME)
            }
        }
    }
    
    suspend fun saveUserInfo(userId: String, email: String, firstName: String?, lastName: String?) {
        dataStore.edit { preferences ->
            preferences[USER_ID] = userId
            preferences[USER_EMAIL] = email
            firstName?.let { preferences[USER_FIRST_NAME] = it }
            lastName?.let { preferences[USER_LAST_NAME] = it }
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
        }
    }
}
