package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.consumeWindowInsets
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Login Screen - Exact match to design
 * Dark blue gradient background with email/password fields
 */
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var rememberMe by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }
    var emailFocused by remember { mutableStateOf(false) }
    var passwordFocused by remember { mutableStateOf(false) }
    
    val focusManager = LocalFocusManager.current
    
    // Entrance animation
    val contentAlpha by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "content_alpha"
    )
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF1A3A8A), // Brighter blue in center
                        Color(0xFF0A1A3A)  // Dark blue at edges
                    ),
                    radius = 1200f
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding() // Add padding for status bar and navigation bar
                .imePadding() // Add padding when keyboard appears
                .padding(horizontal = 24.dp)
                .graphicsLayer { alpha = contentAlpha },
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(60.dp))
            
            // Logo Section
            LogoSection()
            
            Spacer(modifier = Modifier.height(60.dp))
            
            // Email Field
            EmailInputField(
                value = email,
                onValueChange = { email = it },
                isFocused = emailFocused,
                onFocusChanged = { emailFocused = it },
                onNext = { focusManager.moveFocus(FocusDirection.Down) }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Password Field
            PasswordInputField(
                value = password,
                onValueChange = { password = it },
                isFocused = passwordFocused,
                onFocusChanged = { passwordFocused = it },
                passwordVisible = passwordVisible,
                onPasswordVisibilityToggle = { passwordVisible = !passwordVisible },
                onDone = { focusManager.clearFocus() }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Remember Me & Forgot Password
            RememberAndForgotRow(
                rememberMe = rememberMe,
                onRememberMeChange = { rememberMe = it }
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Divider with "or"
            OrDivider()
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Already have account prompt
            AlreadyHaveAccountSection()
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Sign In Button
            SignInButton(
                onClick = { onLoginSuccess() },
                enabled = email.isNotBlank() && password.isNotBlank()
            )
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Guest View
            GuestViewSection()
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun LogoSection() {
    val infiniteTransition = rememberInfiniteTransition(label = "logo_pulse")
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logo_scale"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600)) + slideInVertically(
            initialOffsetY = { -30 },
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.scale(logoScale)
        ) {
            // Logo with Cloud Icon
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Cloud Icon
                Icon(
                    imageVector = Icons.Default.Cloud,
                    contentDescription = "Cloud",
                    tint = V8idColors.White,
                    modifier = Modifier.size(48.dp)
                )
                
                // Triangle logo
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(V8idColors.White),
                    contentAlignment = Alignment.Center
                ) {
                    // Simple triangle representation
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color(0xFF5883F0))
                    )
                }
            }
            
            Text(
                text = "V8id Cloud",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp
                ),
                color = V8idColors.White
            )
        }
    }
}

@Composable
private fun EmailInputField(
    value: String,
    onValueChange: (String) -> Unit,
    isFocused: Boolean,
    onFocusChanged: (Boolean) -> Unit,
    onNext: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.02f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "email_scale"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 400)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = tween(600, delayMillis = 400)
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .scale(scale)
                .clip(RoundedCornerShape(28.dp))
                .background(
                    color = Color(0xFF2A3441), // Lighter, better contrast background
                    shape = RoundedCornerShape(28.dp)
                )
                .border(
                    width = if (isFocused) 1.5.dp else 0.dp,
                    color = V8idColors.PrimaryBlue.copy(alpha = if (isFocused) 0.8f else 0f),
                    shape = RoundedCornerShape(28.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Start,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 16.dp, vertical = 0.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Email,
                    contentDescription = null,
                    tint = V8idColors.White.copy(alpha = 0.8f),
                    modifier = Modifier
                        .size(20.dp)
                        .align(Alignment.CenterVertically)
                )
                Spacer(modifier = Modifier.width(12.dp))
                
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (value.isEmpty() && !isFocused) {
                        Text(
                            text = "Email",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                                fontSize = 16.sp
                            ),
                            color = V8idColors.White.copy(alpha = 0.6f),
                            modifier = Modifier.align(Alignment.CenterStart)
                        )
                    }
                    
                    androidx.compose.foundation.text.BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        textStyle = MaterialTheme.typography.bodyMedium.copy(
                            color = V8idColors.White,
                            fontWeight = FontWeight.Medium,
                            fontSize = 16.sp
                        ),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(onNext = { onNext() }),
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.CenterStart)
                            .onFocusChanged { focusState ->
                                onFocusChanged(focusState.isFocused)
                            },
                        singleLine = true,
                        cursorBrush = androidx.compose.ui.graphics.SolidColor(V8idColors.White)
                    )
                }
            }
        }
    }
}

@Composable
private fun PasswordInputField(
    value: String,
    onValueChange: (String) -> Unit,
    isFocused: Boolean,
    onFocusChanged: (Boolean) -> Unit,
    passwordVisible: Boolean,
    onPasswordVisibilityToggle: () -> Unit,
    onDone: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.02f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "password_scale"
    )
    
    val iconScale by animateFloatAsState(
        targetValue = if (passwordVisible) 1.1f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        label = "icon_scale"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 500)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = tween(600, delayMillis = 500)
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .scale(scale)
                .clip(RoundedCornerShape(28.dp))
                .background(
                    color = Color(0xFF2A3441), // Lighter, better contrast background
                    shape = RoundedCornerShape(28.dp)
                )
                .border(
                    width = if (isFocused) 1.5.dp else 0.dp,
                    color = V8idColors.PrimaryBlue.copy(alpha = if (isFocused) 0.8f else 0f),
                    shape = RoundedCornerShape(28.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Start,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 16.dp, vertical = 0.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = V8idColors.White.copy(alpha = 0.8f),
                    modifier = Modifier
                        .size(20.dp)
                        .align(Alignment.CenterVertically)
                )
                Spacer(modifier = Modifier.width(12.dp))
                
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (value.isEmpty() && !isFocused) {
                        Text(
                            text = "Password",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                                fontSize = 16.sp
                            ),
                            color = V8idColors.White.copy(alpha = 0.6f),
                            modifier = Modifier.align(Alignment.CenterStart)
                        )
                    }
                    
                    androidx.compose.foundation.text.BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        textStyle = MaterialTheme.typography.bodyMedium.copy(
                            color = V8idColors.White,
                            fontWeight = FontWeight.Medium,
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
                        keyboardActions = KeyboardActions(onDone = { onDone() }),
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.CenterStart)
                            .onFocusChanged { focusState ->
                                onFocusChanged(focusState.isFocused)
                            },
                        singleLine = true,
                        cursorBrush = androidx.compose.ui.graphics.SolidColor(V8idColors.White)
                    )
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                IconButton(
                    onClick = onPasswordVisibilityToggle,
                    modifier = Modifier
                        .scale(iconScale)
                        .size(40.dp)
                        .align(Alignment.CenterVertically)
                ) {
                    Crossfade(
                        targetState = passwordVisible,
                        animationSpec = tween(300),
                        label = "password_visibility"
                    ) { visible ->
                        Icon(
                            imageVector = if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (visible) "Hide password" else "Show password",
                            tint = V8idColors.LightGray.copy(alpha = 0.8f),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RememberAndForgotRow(
    rememberMe: Boolean,
    onRememberMeChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Remember Me - Toggle Switch
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Switch(
                checked = rememberMe,
                onCheckedChange = onRememberMeChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = V8idColors.White,
                    checkedTrackColor = V8idColors.PrimaryBlue,
                    uncheckedThumbColor = V8idColors.LightGray,
                    uncheckedTrackColor = Color(0xFF2A3441)
                )
            )
            Text(
                text = "Remember me",
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
                color = V8idColors.LightGray
            )
        }
        
        // Forgot Password
        var forgotPressed by remember { mutableStateOf(false) }
        val forgotScale by animateFloatAsState(
            targetValue = if (forgotPressed) 0.95f else 1f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessHigh
            ),
            label = "forgot_scale"
        )
        
        Text(
            text = "Forgot password?",
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
            color = V8idColors.LightGray,
            modifier = Modifier
                .scale(forgotScale)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    forgotPressed = true
                    // Handle forgot password
                }
        )
    }
}

@Composable
private fun OrDivider() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            thickness = 1.dp,
            color = V8idColors.LightGray.copy(alpha = 0.3f)
        )
        Text(
            text = "or",
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            color = V8idColors.LightGray.copy(alpha = 0.6f)
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            thickness = 1.dp,
            color = V8idColors.LightGray.copy(alpha = 0.3f)
        )
    }
}

@Composable
private fun AlreadyHaveAccountSection() {
    Text(
        text = "Already have an account?",
        style = MaterialTheme.typography.bodyMedium.copy(
            fontSize = 14.sp
        ),
        color = V8idColors.LightGray.copy(alpha = 0.8f),
        textAlign = TextAlign.Center
    )
}

@Composable
private fun SignInButton(
    onClick: () -> Unit,
    enabled: Boolean
) {
    val buttonScale by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.98f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "signin_scale"
    )
    
    val buttonAlpha by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.7f,
        animationSpec = tween(300),
        label = "signin_alpha"
    )
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600, delayMillis = 700)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
    ) {
        Button(
            onClick = onClick,
            enabled = enabled,
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
            Text(
                text = "Sign in",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                )
            )
        }
    }
}

@Composable
private fun GuestViewSection() {
    val text = buildAnnotatedString {
        withStyle(style = SpanStyle(color = V8idColors.LightGray.copy(alpha = 0.7f))) {
            append("Want to skip? ")
        }
        withStyle(
            style = SpanStyle(
                color = V8idColors.LightGray,
                fontWeight = FontWeight.SemiBold
            )
        ) {
            append("Guest View")
        }
    }
    
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        label = "guest_scale"
    )
    
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
        textAlign = TextAlign.Center,
        modifier = Modifier
            .scale(scale)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                isPressed = true
                // Handle guest view
            }
    )
}
