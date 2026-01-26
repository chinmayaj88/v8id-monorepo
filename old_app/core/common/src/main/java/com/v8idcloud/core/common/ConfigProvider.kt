package com.v8idcloud.core.common

/**
 * Configuration provider interface
 * Used to inject environment-specific configuration (BASE_URL, etc.)
 * Implemented in app module using BuildConfig
 */
interface ConfigProvider {
    val baseUrl: String
    val environment: String
}
