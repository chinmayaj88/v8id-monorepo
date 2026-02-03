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
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.CheckCircle
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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.imePadding
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.presentation.ui.components.AuthBackButton
import com.v8idcloud.feature.auth.presentation.ui.components.AuthLogoSection
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.navigation.NavHostController

/**
 * Reset Password Screen
 * Reset password using token from email
 */
@Composable
fun ResetPasswordScreen(
    resetToken: String = "",
    navController: NavHostController,
    onResetSuccess: () -> Unit = {}
) {
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    var passwordFocused by remember { mutableStateOf(false) }
    var confirmPasswordFocused by remember { mutableStateOf(false) }
    var isResetting by remember { mutableStateOf(false) }
    var isSuccess by remember { mutableStateOf(false) }
    
    val focusManager = LocalFocusManager.current
    val scope = rememberCoroutineScope()
    
    // Derived states - password validation
    val passwordRequirements = remember(password) {
        mapOf(
            "minLength" to (password.length >= 12),
            "hasUpperCase" to password.any(Char::isUpperCase),
            "hasLowerCase" to password.any(Char::isLowerCase),
            "hasNumber" to password.any(Char::isDigit),
            "hasSpecial" to password.any { !it.isLetterOrDigit() }
        )
    }
    
    val isPasswordValid = remember(passwordRequirements) {
        passwordRequirements.values.all { it }
    }
    
    val passwordsMatch = remember(password, confirmPassword) {
        password.isNotEmpty() && password == confirmPassword
    }
    
    val canSubmit = remember(isPasswordValid, passwordsMatch, isResetting) {
        isPasswordValid && passwordsMatch && !isResetting
    }
    
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
            
            if (isSuccess) {
                // Success State
                SuccessSection(
                    message = "Your password has been reset successfully. You can now login with your new password."
                )
            } else {
                // Form State
                TitleSection(
                    title = "Reset Password",
                    description = "Enter your new password below"
                )
                
                Spacer(modifier = Modifier.height(48.dp))
                
                // Password Field
                PasswordInputField(
                    value = password,
                    onValueChange = { password = it },
                    isFocused = passwordFocused,
                    onFocusChanged = { passwordFocused = it },
                    passwordVisible = passwordVisible,
                    onPasswordVisibilityToggle = { passwordVisible = !passwordVisible },
                    placeholder = "New Password",
                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                )
                
                // Password Requirements
                if (password.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    PasswordRequirementsList(requirements = passwordRequirements)
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Confirm Password Field
                PasswordInputField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    isFocused = confirmPasswordFocused,
                    onFocusChanged = { confirmPasswordFocused = it },
                    passwordVisible = confirmPasswordVisible,
                    onPasswordVisibilityToggle = { confirmPasswordVisible = !confirmPasswordVisible },
                    placeholder = "Confirm Password",
                    onDone = { focusManager.clearFocus() }
                )
                
                // Password Match Indicator
                if (confirmPassword.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    PasswordMatchIndicator(matches = passwordsMatch)
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Reset Button
                ResetButton(
                    onClick = {
                        if (canSubmit) {
                            isResetting = true
                            // TODO: Call API to reset password
                            scope.launch {
                                delay(1500)
                                isResetting = false
                                isSuccess = true
                                onResetSuccess()
                            }
                        }
                    },
                    enabled = canSubmit,
                    isLoading = isResetting
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
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
private fun SuccessSection(message: String) {
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600)) + scaleIn(
            initialScale = 0.9f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Success",
                tint = V8idColors.SuccessGreen,
                modifier = Modifier.size(64.dp)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Password Reset",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp
                ),
                color = V8idColors.White,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontSize = 14.sp
                ),
                color = V8idColors.LightGray.copy(alpha = 0.8f),
                textAlign = TextAlign.Center
            )
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
    placeholder: String,
    onNext: (() -> Unit)? = null,
    onDone: (() -> Unit)? = null
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
        enter = fadeIn(tween(600, delayMillis = 300)) + slideInVertically(
            initialOffsetY = { 20 },
            animationSpec = tween(600, delayMillis = 300)
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .scale(scale)
                .clip(RoundedCornerShape(28.dp))
                .background(
                    color = Color(0xFF2A3441),
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
                            text = placeholder,
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
                            imeAction = if (onNext != null) ImeAction.Next else ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { onNext?.invoke() },
                            onDone = { onDone?.invoke() }
                        ),
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
private fun PasswordRequirementsList(requirements: Map<String, Boolean>) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        RequirementItem(
            text = "At least 12 characters",
            met = requirements["minLength"] == true
        )
        RequirementItem(
            text = "One uppercase letter",
            met = requirements["hasUpperCase"] == true
        )
        RequirementItem(
            text = "One lowercase letter",
            met = requirements["hasLowerCase"] == true
        )
        RequirementItem(
            text = "One number",
            met = requirements["hasNumber"] == true
        )
        RequirementItem(
            text = "One special character",
            met = requirements["hasSpecial"] == true
        )
    }
}

@Composable
private fun RequirementItem(text: String, met: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = if (met) "✓" else "○",
            style = MaterialTheme.typography.bodySmall.copy(
                fontSize = 12.sp
            ),
            color = if (met) V8idColors.SuccessGreen else V8idColors.LightGray.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall.copy(
                fontSize = 12.sp
            ),
            color = if (met) V8idColors.LightGray.copy(alpha = 0.8f) else V8idColors.LightGray.copy(alpha = 0.5f)
        )
    }
}

@Composable
private fun PasswordMatchIndicator(matches: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = if (matches) "✓" else "○",
            style = MaterialTheme.typography.bodySmall.copy(
                fontSize = 12.sp
            ),
            color = if (matches) V8idColors.SuccessGreen else V8idColors.LightGray.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = if (matches) "Passwords match" else "Passwords must match",
            style = MaterialTheme.typography.bodySmall.copy(
                fontSize = 12.sp
            ),
            color = if (matches) V8idColors.SuccessGreen else V8idColors.LightGray.copy(alpha = 0.5f)
        )
    }
}

@Composable
private fun ResetButton(
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
        label = "reset_scale"
    )
    
    val buttonAlpha by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.7f,
        animationSpec = tween(300),
        label = "reset_alpha"
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
                    text = "Reset Password",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                )
            }
        }
    }
}
