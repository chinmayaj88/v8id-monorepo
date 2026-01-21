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
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel
import com.v8idcloud.feature.home.presentation.ui.HomeScreen
import com.v8idcloud.feature.folders.presentation.ui.FoldersScreen
import com.v8idcloud.feature.user.presentation.ui.UserScreen
import com.v8idcloud.feature.user.presentation.ui.EditProfileScreen
import com.v8idcloud.feature.user.presentation.ui.StorageAnalyticsScreen
import com.v8idcloud.feature.user.presentation.ui.ActiveSessionsScreen
import com.v8idcloud.feature.vault.presentation.ui.VaultScreen
import coil.ImageLoader

/**
 * App Navigation Graph
 * Centralized navigation configuration
 */
@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = "auth/login",
    modifier: Modifier = Modifier,
    imageLoader: ImageLoader? = null
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
        
        composable(
            route = "folders?folderId={folderId}",
            arguments = listOf(
                navArgument("folderId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val folderId = backStackEntry.arguments?.getString("folderId")
            MainScreen(navController = navController) {
                FoldersScreen(navController = navController) // Pass folderId if needed
            }
        }
        
        composable("user") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            MainScreen(navController = navController) {
                UserScreen(navController = navController, viewModel = homeViewModel, imageLoader = imageLoader)
            }
        }

        composable("user/edit") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            EditProfileScreen(navController = navController, viewModel = homeViewModel)
        }
        
        composable("user/storage") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            StorageAnalyticsScreen(navController = navController, viewModel = homeViewModel)
        }

        composable("user/active-sessions") {
            val homeViewModel: HomeViewModel = hiltViewModel()
            ActiveSessionsScreen(navController = navController, viewModel = homeViewModel)
        }
        
        composable("vault") {
            MainScreen(navController = navController) {
                VaultScreen(navController = navController)
            }
        }
    }
}
