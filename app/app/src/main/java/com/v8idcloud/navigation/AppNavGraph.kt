package com.v8idcloud.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.hilt.navigation.compose.hiltViewModel
import com.v8idcloud.MainScreen
import com.v8idcloud.feature.auth.presentation.ui.*
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeViewModel

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
        
        // Main app tabs (accessible after login) - all wrapped with MainScreen for bottom nav
        composable("home") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            MainScreen(navController = navController) {
                HomeScreen(
                    navController = navController,
                    viewModel = homeViewModel
                )
            }
        }
        
        composable("folders") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            MainScreen(navController = navController) {
                FoldersScreen(navController = navController)
            }
        }
        
        composable("user") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            MainScreen(navController = navController) {
                UserScreen(navController = navController, viewModel = homeViewModel)
            }
        }
        
        composable("vault") {
            MainScreen(navController = navController) {
                VaultScreen(navController = navController)
            }
        }
    }
}
