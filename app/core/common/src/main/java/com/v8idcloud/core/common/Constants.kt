package com.v8idcloud.core.common

/**
 * Application-wide constants
 * Note: BASE_URL and ENVIRONMENT are now provided via ConfigProvider (dependency injection)
 * See: app/src/main/java/com/v8idcloud/config/AppConfigProvider.kt
 */
object Constants {
    const val API_TIMEOUT_SECONDS = 30L
    
    // SharedPreferences Keys
    const val PREFS_NAME = "v8id_prefs"
    const val KEY_ACCESS_TOKEN = "key_access_token"
    const val KEY_REFRESH_TOKEN = "key_refresh_token"
    const val KEY_USER_ID = "key_user_id"
}
