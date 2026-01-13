package com.v8idcloud.config

import com.v8idcloud.BuildConfig
import com.v8idcloud.core.common.ConfigProvider
import javax.inject.Inject
import javax.inject.Singleton

/**
 * App-level configuration provider
 * Uses BuildConfig to provide environment-specific values
 */
@Singleton
class AppConfigProvider @Inject constructor() : ConfigProvider {
    override val baseUrl: String = BuildConfig.BASE_URL
    override val environment: String = BuildConfig.ENVIRONMENT
}
