package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.imePadding
import com.v8idcloud.core.ui.theme.V8idColors
import androidx.navigation.NavHostController
import androidx.hilt.navigation.compose.hiltViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.TotpViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.TotpUiState
import com.v8idcloud.feature.auth.presentation.ui.components.AuthLogoSection
import com.v8idcloud.feature.auth.presentation.ui.components.AuthBackButton
import androidx.compose.material3.*
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

/**
 * TOTP Verify Screen
 * Enter 6-digit TOTP code for two-factor authentication
 */
@Composable
fun TotpVerifyScreen(
    navController: NavHostController,
    viewModel: TotpViewModel = hiltViewModel()
) {
    var totpCode by remember { mutableStateOf("") }
    var isFocused by remember { mutableStateOf(false) }
    
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    val focusRequester = remember { FocusRequester() }
    
    // Handle navigation to home screen
    LaunchedEffect(uiState) {
        when (uiState) {
            is TotpUiState.Success -> {
                // Navigate to home screen
                navController.navigate("home") {
                    // Clear auth stack
                    popUpTo("auth/login") { inclusive = true }
                }
            }
            else -> {}
        }
    }
    
    // Derived state - only recompose when code length changes
    val isValidCode = remember(totpCode.length) {
        totpCode.length == 6 && totpCode.all { it.isDigit() }
    }
    
    // Entrance animation
    val contentAlpha by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "content_alpha"
    )
    
    // Auto-focus on mount
    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }
    
    // Snackbar for error messages
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    // Show error toast
    LaunchedEffect(uiState) {
        val currentState = uiState
        if (currentState is TotpUiState.Error) {
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
            Spacer(modifier = Modifier.height(40.dp))
            
            // Back Button
            AuthBackButton(onClick = { navController.popBackStack() })
            
            Spacer(modifier = Modifier.height(40.dp))
            
            // Logo Section
            AuthLogoSection()
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // Title and Description
            TitleSection(
                title = "Two-Factor Authentication",
                description = "Enter the 6-digit code from your authenticator app"
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // TOTP Code Input
            TotpCodeInput(
                code = totpCode,
                onCodeChange = { newCode ->
                    // Only allow digits and limit to 6 characters
                    if (newCode.all { it.isDigit() } && newCode.length <= 6) {
                        totpCode = newCode
                        // Auto-submit when 6 digits entered
                        if (newCode.length == 6) {
                            focusManager.clearFocus()
                        }
                    }
                },
                isFocused = isFocused,
                onFocusChanged = { isFocused = it },
                focusRequester = focusRequester
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Verify Button
            VerifyButton(
                onClick = {
                    if (isValidCode) {
                        viewModel.verifyTotp(totpCode)
                    }
                },
                enabled = isValidCode && uiState !is TotpUiState.Loading,
                isLoading = uiState is TotpUiState.Loading
            )
            
            Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}


@Composable
private fun TitleSection(
    title: String,
    description: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp
            ),
            color = V8idColors.White,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontSize = 14.sp
            ),
            color = V8idColors.LightGray.copy(alpha = 0.8f),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun TotpCodeInput(
    code: String,
    onCodeChange: (String) -> Unit,
    isFocused: Boolean,
    onFocusChanged: (Boolean) -> Unit,
    focusRequester: FocusRequester
) {
    val focusManager = LocalFocusManager.current
    
    // Capture callback to avoid naming conflict with modifier
    val onFocusChangeCallback = onFocusChanged
    
    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.02f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "totp_scale"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 300)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = tween(600, delayMillis = 300)
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .scale(scale)
                .clip(RoundedCornerShape(16.dp))
                .background(
                    color = Color(0xFF2A3441),
                    shape = RoundedCornerShape(16.dp)
                )
                .border(
                    width = if (isFocused) 1.5.dp else 0.dp,
                    color = V8idColors.PrimaryBlue.copy(alpha = if (isFocused) 0.8f else 0f),
                    shape = RoundedCornerShape(16.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                repeat(6) { index ->
                    val digit = code.getOrNull(index)?.toString() ?: ""
                    val isFilled = digit.isNotEmpty()
                    
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                color = if (isFilled) {
                                    V8idColors.PrimaryBlue.copy(alpha = 0.2f)
                                } else {
                                    Color(0xFF1A2332)
                                }
                            )
                            .border(
                                width = if (index == code.length && isFocused) 2.dp else 0.dp,
                                color = V8idColors.PrimaryBlue,
                                shape = RoundedCornerShape(8.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isFilled) {
                            Text(
                                text = digit,
                                style = MaterialTheme.typography.headlineMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp
                                ),
                                color = V8idColors.White
                            )
                        }
                    }
                }
            }
            
            // Hidden text field for input
            androidx.compose.foundation.text.BasicTextField(
                value = code,
                onValueChange = onCodeChange,
                textStyle = MaterialTheme.typography.headlineMedium.copy(
                    color = Color.Transparent,
                    fontSize = 24.sp
                ),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.NumberPassword,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = { focusManager.clearFocus() }
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp)
                    .focusRequester(focusRequester)
                    .onFocusChanged { focusState ->
                        onFocusChangeCallback(focusState.isFocused)
                    },
                singleLine = true,
                cursorBrush = androidx.compose.ui.graphics.SolidColor(V8idColors.White)
            )
        }
    }
}

@Composable
private fun VerifyButton(
    onClick: () -> Unit,
    enabled: Boolean,
    isLoading: Boolean
) {
    val buttonScale by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.98f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "verify_scale"
    )
    
    val buttonAlpha by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.7f,
        animationSpec = tween(300),
        label = "verify_alpha"
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
            onClick = onClick,
            enabled = enabled && !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .scale(buttonScale)
                .graphicsLayer { alpha = buttonAlpha },
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = V8idColors.PrimaryBlue,
                contentColor = V8idColors.White,
                disabledContainerColor = V8idColors.PrimaryBlue.copy(alpha = 0.5f),
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
                Text(
                    text = "Verify",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                )
            }
        }
    }
}
