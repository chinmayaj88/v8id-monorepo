package com.v8idcloud.core.data.network

import com.v8idcloud.core.common.ConfigProvider
import com.v8idcloud.core.common.Constants
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(Constants.API_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(Constants.API_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(Constants.API_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        configProvider: ConfigProvider
    ): Retrofit = Retrofit.Builder()
        .baseUrl(configProvider.baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    /**
     * Provide AuthApiService
     * Similar to: const api = axios.create({ baseURL: '...' })
     */
    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService =
        retrofit.create(AuthApiService::class.java)
}
