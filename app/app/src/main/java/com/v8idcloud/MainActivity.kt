package com.v8idcloud

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import coil.ImageLoader
import com.v8idcloud.core.ui.theme.V8idTheme
import com.v8idcloud.navigation.AppNavGraph
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var imageLoader: ImageLoader
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            V8idTheme {
                AppNavGraph(
                        startDestination = "auth/login",
                        modifier = Modifier.fillMaxSize(),
                        imageLoader = imageLoader
                )
            }
        }
    }
}
