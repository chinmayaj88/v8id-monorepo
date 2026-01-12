package com.v8idcloud

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.v8idcloud.core.ui.navigation.AppNavGraph
import com.v8idcloud.core.ui.theme.V8idTheme
import com.v8idcloud.feature.auth.presentation.ui.LoginScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            V8idTheme {
                AppNavGraph(
                    modifier = Modifier.fillMaxSize(),
                    authLoginScreen = {
                        LoginScreen(
                            onLoginSuccess = {
                                // Navigate to home when implemented
                            }
                        )
                    },
                    homeScreen = {
                        // Will be implemented later
                    }
                )
            }
        }
    }
}
