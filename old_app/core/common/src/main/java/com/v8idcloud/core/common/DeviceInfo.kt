package com.v8idcloud.core.common

import android.content.Context
import android.os.Build
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Device Information Helper
 * Provides device ID, name, and type for authentication
 * Thread-safe singleton for device information access
 */
@Singleton
class DeviceInfo @Inject constructor(
    @ApplicationContext private val context: Context
) {
    /**
     * Get unique device ID
     * Uses Android ID as device identifier
     */
    fun getDeviceId(): String = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ANDROID_ID
    ) ?: "unknown-device-id"
    
    /**
     * Get device name
     * Returns manufacturer and model
     */
    fun getDeviceName(): String = buildString {
        append(Build.MANUFACTURER)
        append(" ")
        append(Build.MODEL)
    }.trim()
    
    /**
     * Get device type
     * Always returns "MOBILE" for Android
     */
    fun getDeviceType(): String = "MOBILE"
}
