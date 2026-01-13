package com.v8idcloud.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.v8idcloud.feature.auth.presentation.ui.*

/**
 * App Navigation Graph
 * Centralized navigation configuration
 */
@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = "auth/login",
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable("auth/login") {
            LoginScreen(navController = navController)
        }
        
        composable("auth/totp-verify") {
            TotpVerifyScreen(navController = navController)
        }
        
        composable("auth/forgot-password") {
            ForgotPasswordScreen(navController = navController)
        }
        
        composable(
            route = "auth/reset-password?token={token}",
            arguments = listOf(
                navArgument("token") {
                    type = NavType.StringType
                    defaultValue = ""
                }
            )
        ) { backStackEntry ->
            ResetPasswordScreen(
                resetToken = backStackEntry.arguments?.getString("token").orEmpty(),
                navController = navController
            )
        }
        
        composable("home") {
            HomeScreen(navController = navController)
        }
    }
}
