package com.v8idcloud.config

import com.v8idcloud.core.common.ConfigProvider
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Configuration module
 * Provides ConfigProvider implementation
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class ConfigModule {
    @Binds
    @Singleton
    abstract fun bindConfigProvider(
        appConfigProvider: AppConfigProvider
    ): ConfigProvider
}
