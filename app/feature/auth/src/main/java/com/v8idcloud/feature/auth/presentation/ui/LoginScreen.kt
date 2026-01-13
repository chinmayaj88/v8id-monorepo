package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusDirection
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.systemBarsPadding
import com.v8idcloud.core.ui.theme.V8idColors
import androidx.navigation.NavHostController
import androidx.hilt.navigation.compose.hiltViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginUiState
import com.v8idcloud.feature.auth.presentation.ui.components.AuthLogoSection
import androidx.compose.material3.*
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

/**
 * Login Screen - Matches reference design exactly
 * Gradient background with white card for login form
 */
@Composable
fun LoginScreen(
    navController: NavHostController,
    viewModel: LoginViewModel = hiltViewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var rememberMe by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    // Handle navigation to TOTP screen
    LaunchedEffect(uiState) {
        when (uiState) {
            is LoginUiState.RequiresTotp -> {
                navController.navigate("auth/totp-verify")
            }
            else -> {}
        }
    }

    // Entrance animation
    val contentAlpha by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "content_alpha"
    )

    // Snackbar for error messages
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Show error toast
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF0F1A3D), // Deep navy blue
                            Color(0xFF1E3A8A), // Mid blue
                            Color(0xFF3B4F8F), // Lighter blue
                            Color(0xFF8B4789)  // Purple hint at bottom
                        )
                    )
                )
                .systemBarsPadding()
                .navigationBarsPadding()
                .imePadding()
        ) {
            // Top section with logo and gradient background - Shrinks when keyboard appears
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.35f, fill = false)
                    .graphicsLayer { alpha = contentAlpha },
                contentAlignment = Alignment.Center
            ) {
                // Floating gradient orbs effect
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    Color(0x50FF6B9D), // Pink glow
                                    Color.Transparent
                                ),
                                center = androidx.compose.ui.geometry.Offset(200f, 300f),
                                radius = 400f
                            )
                        )
                )
                
                // Logo
                AuthLogoSection(animate = false, iconSize = 72.dp)
            }

            // Bottom white card with login form - Keyboard avoidance
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.65f, fill = true)
                    .clip(RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
                    .background(Color.White)
                    .padding(horizontal = 32.dp)
                    .padding(top = 28.dp, bottom = 28.dp)
                    .graphicsLayer { alpha = contentAlpha },
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Email Address Label
                Text(
                    text = "Email Address",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Medium,
                        fontSize = 15.sp,
                        color = Color(0xFF1F2937)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                // Email Input Field
                ModernTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = "1234@gmail.com",
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                )
                
                Spacer(modifier = Modifier.height(20.dp))
                
                // Password Label
                Text(
                    text = "Password",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Medium,
                        fontSize = 15.sp,
                        color = Color(0xFF1F2937)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                // Password Input Field
                ModernPasswordField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = "password",
                    passwordVisible = passwordVisible,
                    onPasswordVisibilityToggle = { passwordVisible = !passwordVisible },
                    onDone = { focusManager.clearFocus() }
                )
                
                Spacer(modifier = Modifier.height(10.dp))
                
                // Remember Me & Forgot Password in same row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Remember Me Checkbox
                    Row(
                        modifier = Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { rememberMe = !rememberMe },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = rememberMe,
                            onCheckedChange = { rememberMe = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = Color(0xFF5B8DEE),
                                uncheckedColor = Color(0xFFD1D5DB),
                                checkmarkColor = Color.White
                            ),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Remember me",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontSize = 13.sp,
                                color = Color(0xFF6B7280)
                            )
                        )
                    }
                    
                    // Forgot Password
                    Text(
                        text = "Forgot Password?",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF5B8DEE)
                        ),
                        modifier = Modifier.clickable {
                            navController.navigate("auth/forgot-password")
                        }
                    )
                }
                
                Spacer(modifier = Modifier.height(20.dp))

                // Login Button with Gradient
                GradientButton(
                    text = "Log in",
                    onClick = {
                        viewModel.login(email.trim(), password)
                    },
                    enabled = email.isNotBlank() && password.isNotBlank() && uiState !is LoginUiState.Loading,
                    isLoading = uiState is LoginUiState.Loading
                )
                
                Spacer(modifier = Modifier.weight(1f, fill = false))
                
                // Terms and Privacy Policy
                Text(
                    text = buildAnnotatedString {
                        withStyle(style = SpanStyle(color = Color(0xFF6B7280))) {
                            append("By logging in, you agree to our updated ")
                        }
                        withStyle(style = SpanStyle(color = Color(0xFF5B8DEE), fontWeight = FontWeight.Medium)) {
                            append("terms and service")
                        }
                        withStyle(style = SpanStyle(color = Color(0xFF6B7280))) {
                            append(" and ")
                        }
                        withStyle(style = SpanStyle(color = Color(0xFF5B8DEE), fontWeight = FontWeight.Medium)) {
                            append("privacy policy")
                        }
                    },
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                
            }
        }
    }
}

// Modern text field matching the reference design
@Composable
private fun ModernTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Done,
    onNext: () -> Unit = {},
    onDone: () -> Unit = {}
) {
    androidx.compose.foundation.text.BasicTextField(
        value = value,
        onValueChange = onValueChange,
        textStyle = MaterialTheme.typography.bodyLarge.copy(
            color = Color(0xFF1F2937),
            fontSize = 16.sp
        ),
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction
        ),
        keyboardActions = KeyboardActions(
            onNext = { onNext() },
            onDone = { onDone() }
        ),
        singleLine = true,
        cursorBrush = androidx.compose.ui.graphics.SolidColor(Color(0xFF5B8DEE)),
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF9FAFB))
                    .border(
                        width = 1.dp,
                        color = Color(0xFFE5E7EB),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .padding(horizontal = 18.dp, vertical = 18.dp)
            ) {
                if (value.isEmpty()) {
                    Text(
                        text = placeholder,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            color = Color(0xFF9CA3AF),
                            fontSize = 16.sp
                        )
                    )
                }
                innerTextField()
            }
        }
    )
}

@Composable
private fun ModernPasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    passwordVisible: Boolean,
    onPasswordVisibilityToggle: () -> Unit,
    onDone: () -> Unit = {}
) {
    androidx.compose.foundation.text.BasicTextField(
        value = value,
        onValueChange = onValueChange,
        textStyle = MaterialTheme.typography.bodyLarge.copy(
            color = Color(0xFF1F2937),
            fontSize = 16.sp
        ),
        visualTransformation = if (passwordVisible) {
            VisualTransformation.None
        } else {
            PasswordVisualTransformation()
        },
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Password,
            imeAction = ImeAction.Done
        ),
        keyboardActions = KeyboardActions(
            onDone = { onDone() }
        ),
        singleLine = true,
        cursorBrush = androidx.compose.ui.graphics.SolidColor(Color(0xFF5B8DEE)),
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF9FAFB))
                    .border(
                        width = 1.dp,
                        color = Color(0xFFE5E7EB),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .padding(horizontal = 18.dp, vertical = 18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        if (value.isEmpty()) {
                            Text(
                                text = placeholder,
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    color = Color(0xFF9CA3AF),
                                    fontSize = 16.sp
                                )
                            )
                        }
                        innerTextField()
                    }
                    IconButton(
                        onClick = onPasswordVisibilityToggle,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (passwordVisible) "Hide password" else "Show password",
                            tint = Color(0xFF9CA3AF),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    )
}

@Composable
private fun GradientButton(
    text: String,
    onClick: () -> Unit,
    enabled: Boolean,
    isLoading: Boolean
) {
    Button(
        onClick = onClick,
        enabled = enabled && !isLoading,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        shape = RoundedCornerShape(28.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color(0xFFE5E7EB)
        ),
        contentPadding = PaddingValues(0.dp),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 0.dp,
            pressedElevation = 2.dp,
            disabledElevation = 0.dp
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = if (enabled && !isLoading) {
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFF3B5FD9), // Blue
                                Color(0xFF8B4789)  // Purple
                            )
                        )
                    } else {
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFFD1D5DB),
                                Color(0xFFD1D5DB)
                            )
                        )
                    },
                    shape = RoundedCornerShape(28.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = text,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 17.sp,
                        color = Color.White
                    )
                )
            }
        }
    }
}
