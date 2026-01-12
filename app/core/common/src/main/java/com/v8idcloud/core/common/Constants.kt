package com.v8idcloud.core.common

/**
 * Application-wide constants
 */
object Constants {
    // API Configuration
    const val BASE_URL = "https://api.v8idcloud.com/"
    const val API_TIMEOUT_SECONDS = 30L
    
    // SharedPreferences Keys
    const val PREFS_NAME = "v8id_prefs"
    const val KEY_ACCESS_TOKEN = "key_access_token"
    const val KEY_REFRESH_TOKEN = "key_refresh_token"
    const val KEY_USER_ID = "key_user_id"
}
