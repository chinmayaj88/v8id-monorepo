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
import androidx.compose.material.icons.filled.Email
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
 * Forgot Password Screen
 * Request password reset by entering email address
 */
@Composable
fun ForgotPasswordScreen(
    navController: NavHostController,
    onResetLinkSent: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var emailFocused by remember { mutableStateOf(false) }
    var isSubmitting by remember { mutableStateOf(false) }
    var isSuccess by remember { mutableStateOf(false) }
    
    val focusManager = LocalFocusManager.current
    val scope = rememberCoroutineScope()
    
    // Derived state - email validation
    val isValidEmail = remember(email) {
        android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
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
                    message = "If an account with that email exists, a password reset link has been sent."
                )
            } else {
                // Form State
                TitleSection(
                    title = "Forgot Password?",
                    description = "Enter your email address and we'll send you a link to reset your password"
                )
                
                Spacer(modifier = Modifier.height(48.dp))
                
                // Email Field
                EmailInputField(
                    value = email,
                    onValueChange = { email = it },
                    isFocused = emailFocused,
                    onFocusChanged = { emailFocused = it },
                    onDone = { focusManager.clearFocus() }
                )
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // Submit Button
                SubmitButton(
                    onClick = {
                        if (isValidEmail && !isSubmitting) {
                            isSubmitting = true
                            // TODO: Call API to send reset link
                            scope.launch {
                                delay(1500)
                                isSubmitting = false
                                isSuccess = true
                                onResetLinkSent()
                            }
                        }
                    },
                    enabled = isValidEmail && !isSubmitting,
                    isLoading = isSubmitting
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
                text = "Check your email",
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
private fun EmailInputField(
    value: String,
    onValueChange: (String) -> Unit,
    isFocused: Boolean,
    onFocusChanged: (Boolean) -> Unit,
    onDone: () -> Unit
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
            }
        }
    }
}

@Composable
private fun SubmitButton(
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
        label = "submit_scale"
    )
    
    val buttonAlpha by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.7f,
        animationSpec = tween(300),
        label = "submit_alpha"
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
                    text = "Send Reset Link",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                )
            }
        }
    }
}
