package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeUiState
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Compute user name
    val userEmail = userEmailFlow ?: ""
    val userName = remember(userFirstNameFlow, userLastNameFlow, userEmail) {
        buildString {
            if (!userFirstNameFlow.isNullOrBlank()) append(userFirstNameFlow)
            if (!userLastNameFlow.isNullOrBlank()) {
                if (isNotEmpty()) append(" ")
                append(userLastNameFlow)
            }
        }.takeIf { it.isNotBlank() } ?: userEmail
    }

    // Handle logout success
    LaunchedEffect(uiState) {
        if (uiState is HomeUiState.LoggedOut) {
            navController.navigate("auth/login") {
                popUpTo("auth/login") { inclusive = true }
            }
        }
    }

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
        ) {
            // Background Image
            Image(
                painter = painterResource(id = R.drawable.bg1),
                contentDescription = "Background",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            // Floating Orbs
            HomeFloatingOrbs()

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
            ) {
                // Logo Section
                HomeLogoSection()

                // Welcome Card
                WelcomeCard(
                    userName = userName,
                    userEmail = userEmail,
                    isLoading = uiState is HomeUiState.LoggingOut,
                    onLogoutClick = {
                        viewModel.logout {}
                    }
                )
            }
        }
    }
}

@Composable
private fun HomeFloatingOrbs() {
    val infiniteTransition = rememberInfiniteTransition(label = "orb_animation")

    val orb1Alpha by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orb1_alpha"
    )

    val orb2Alpha by infiniteTransition.animateFloat(
        initialValue = 0.1f,
        targetValue = 0.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "orb2_alpha"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        // Orb 1 - Subtle overlay
        Box(
            modifier = Modifier
                .offset(x = 60.dp, y = 100.dp)
                .size(250.dp)
                .alpha(orb1Alpha)
                .blur(80.dp)
                .background(
                    color = V8idColors.Purple.LightPurple,
                    shape = RoundedCornerShape(50)
                )
        )

        // Orb 2 - Subtle overlay
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = (-40).dp, y = (-100).dp)
                .size(350.dp)
                .alpha(orb2Alpha)
                .blur(80.dp)
                .background(
                    color = V8idColors.Purple.Indigo,
                    shape = RoundedCornerShape(50)
                )
        )
    }
}

@Composable
private fun HomeLogoSection() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(vertical = 16.dp)
    ) {
        // Logo Container
        Surface(
            modifier = Modifier.size(80.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White.copy(alpha = 0.15f),
            shadowElevation = 20.dp
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Icon(
                    imageVector = Icons.Default.Cloud,
                    contentDescription = "V8id Cloud Logo",
                    tint = Color.White,
                    modifier = Modifier.size(42.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Brand Text
        Text(
            text = "V8id Cloud",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Secure Cloud Identity Platform",
            fontSize = 13.sp,
            color = V8idColors.Purple.LightPurple,
            fontWeight = FontWeight.Light
        )
    }
}

@Composable
private fun WelcomeCard(
    userName: String,
    userEmail: String,
    isLoading: Boolean,
    onLogoutClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        shape = RoundedCornerShape(28.dp),
        color = Color.White.copy(alpha = 0.95f),
        shadowElevation = 24.dp
    ) {
        Column(
            modifier = Modifier.padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Success Icon
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Success",
                tint = V8idColors.SuccessGreen,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Welcome Text
            Text(
                text = "Welcome back!",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (userName.isNotBlank()) {
                Text(
                    text = userName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.Purple.DeepPurple
                )
            }

            if (userEmail.isNotBlank()) {
                Text(
                    text = userEmail,
                    fontSize = 14.sp,
                    color = V8idColors.Purple.Indigo
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Info Text
            Text(
                text = "You have successfully logged in to V8id Cloud",
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Logout Button
            Button(
                onClick = onLogoutClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                enabled = !isLoading,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = V8idColors.Semantic.Error,
                    disabledContainerColor = V8idColors.Semantic.Error.copy(alpha = 0.5f)
                ),
                elevation = ButtonDefaults.buttonElevation(
                    defaultElevation = 4.dp,
                    pressedElevation = 8.dp
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = V8idColors.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Logout,
                        contentDescription = "Logout",
                        tint = V8idColors.White,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Logout",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = V8idColors.White
                    )
                }
            }
        }
    }
}
