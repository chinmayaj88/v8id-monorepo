package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.imePadding
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.presentation.ui.components.AuthLogoSection
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeUiState
import androidx.compose.material3.*
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

/**
 * Home Screen
 * Landing screen after successful login + TOTP verification
 */
@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    // Handle logout success
    LaunchedEffect(uiState) {
        if (uiState is HomeUiState.LoggedOut) {
            // Navigate back to login
            navController.navigate("auth/login") {
                popUpTo("auth/login") { inclusive = true }
            }
        }
    }
    
    // Snackbar for messages
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    // Show logout success message
    LaunchedEffect(uiState) {
        if (uiState is HomeUiState.LoggedOut) {
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = "Logged out successfully",
                    duration = SnackbarDuration.Short
                )
            }
        }
    }
    
    // Entrance animation
    val contentAlpha by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "content_alpha"
    )
    
    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState) { snackbarData ->
                Snackbar(
                    snackbarData = snackbarData,
                    containerColor = V8idColors.SuccessGreen,
                    contentColor = V8idColors.White
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF1A3A8A),
                            Color(0xFF0A1A3A)
                        ),
                        radius = 1200f
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
                    .imePadding()
                    .padding(horizontal = 24.dp)
                    .graphicsLayer { alpha = contentAlpha },
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
            Spacer(modifier = Modifier.height(60.dp))
            
            // Logo Section
            AuthLogoSection(iconSize = 64.dp, animate = false)
            
            Spacer(modifier = Modifier.height(60.dp))
            
            // Welcome Message
            WelcomeSection()
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Logout Button
            LogoutButton(
                isLoading = uiState is HomeUiState.LoggingOut,
                onLogoutClick = {
                    viewModel.logout {
                        // Navigation handled by LaunchedEffect
                    }
                }
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}


@Composable
fun WelcomeSection() {
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 300)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = tween(600, delayMillis = 300)
        )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "Welcome!",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp
                ),
                color = V8idColors.White,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "You have successfully logged in to V8id Cloud",
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontSize = 16.sp
                ),
                color = V8idColors.LightGray.copy(alpha = 0.9f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun LogoutButton(
    isLoading: Boolean,
    onLogoutClick: () -> Unit
) {
    val buttonScale by animateFloatAsState(
        targetValue = if (!isLoading) 1f else 0.98f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "logout_scale"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 500)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
    ) {
        Button(
            onClick = onLogoutClick,
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .graphicsLayer { scaleX = buttonScale; scaleY = buttonScale },
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = V8idColors.Semantic.Error,
                contentColor = V8idColors.White,
                disabledContainerColor = V8idColors.Semantic.Error.copy(alpha = 0.5f),
                disabledContentColor = V8idColors.LightGray
            ),
            elevation = ButtonDefaults.buttonElevation(
                defaultElevation = 0.dp,
                pressedElevation = 2.dp
            )
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = V8idColors.White,
                    strokeWidth = 2.dp
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Logout,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Logout",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                )
            }
        }
    }
}
