package com.v8idcloud.core.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

/**
 * App Navigation Graph
 * Centralized navigation configuration
 */
@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = "auth/login",
    modifier: Modifier = Modifier,
    authLoginScreen: @Composable () -> Unit,
    homeScreen: @Composable () -> Unit = {}
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable("auth/login") {
            authLoginScreen()
        }
        
        composable("home") {
            homeScreen()
        }
    }
}
