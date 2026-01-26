package com.v8idcloud

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import dagger.hilt.android.HiltAndroidApp
import okhttp3.OkHttpClient
import javax.inject.Inject
import javax.inject.Named

@HiltAndroidApp
class V8idApplication : Application(), ImageLoaderFactory {
    
    @Inject
    @Named("image")
    lateinit var imageOkHttpClient: OkHttpClient

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .okHttpClient { imageOkHttpClient }
            .crossfade(true)
            .build()
    }
}
