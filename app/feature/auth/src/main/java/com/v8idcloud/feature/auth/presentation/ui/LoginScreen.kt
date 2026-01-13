package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginUiState
import kotlinx.coroutines.launch

/**
 * Login Screen - Blank page ready to build from scratch
 */
@Composable
fun LoginScreen(
    navController: NavHostController,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Handle navigation to TOTP screen
    LaunchedEffect(uiState) {
        when (uiState) {
            is LoginUiState.RequiresTotp -> {
                navController.navigate("auth/totp-verify")
            }
            else -> {}
        }
    }

    // Show error messages
    LaunchedEffect(uiState) {
        val currentState = uiState
        if (currentState is LoginUiState.Error) {
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = currentState.message,
                    duration = SnackbarDuration.Short
                )
                viewModel.resetState()
            }
        }
    }

    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState) { snackbarData ->
                Snackbar(
                    snackbarData = snackbarData,
                    containerColor = V8idColors.Semantic.Error,
                    contentColor = V8idColors.White
                )
            }
        }
    ) { paddingValues ->
        // Blank page - ready for you to add components
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color.White)
        ) {
            // Add your UI components here
        }
    }
}
