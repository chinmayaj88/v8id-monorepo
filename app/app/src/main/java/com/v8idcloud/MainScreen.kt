package com.v8idcloud

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.v8idcloud.core.ui.components.V8idBottomNavigationBar

/**
 * Main Screen with Bottom Navigation
 * This is a wrapper that shows the bottom navigation bar
 * The actual screen content is handled by AppNavGraph navigation
 */
@Composable
fun MainScreen(
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: "home"

    Scaffold(
        containerColor = androidx.compose.ui.graphics.Color.Transparent, // Ensure Scaffold doesn't have a background
        bottomBar = {
            V8idBottomNavigationBar(
                currentRoute = currentRoute,
                onTabSelected = { route ->
                    navController.navigate(route) {
                        // Pop up to "home" to avoid building up a back stack
                        popUpTo("home") {
                            saveState = true
                        }
                        // Avoid multiple copies of the same destination
                        launchSingleTop = true
                        // Restore state when reselecting a previously selected tab
                        restoreState = true
                    }
                }
            )
        }
    ) { paddingValues ->
        // Use Box to overlay content and let it expand behind the bottom bar
        Box(modifier = Modifier.fillMaxSize()) {
            content()
        }
    }
}
