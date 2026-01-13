package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

@Composable
fun ForgotPasswordScreen(
    navController: NavHostController
) {
    var email by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var isSuccess by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Scaffold { paddingValues ->
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
            ForgotPasswordFloatingOrbs()

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
            ) {
                // Logo Section
                ForgotPasswordLogoSection()

                // Forgot Password Card
                ForgotPasswordCard(
                    email = email,
                    isSubmitting = isSubmitting,
                    isSuccess = isSuccess,
                    onEmailChange = { email = it },
                    onSubmitClick = {
                        isSubmitting = true
                        // TODO: Implement API call
                        scope.launch {
                            delay(1500)
                            isSubmitting = false
                            isSuccess = true
                        }
                    },
                    onBackClick = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
private fun ForgotPasswordCard(
    email: String,
    isSubmitting: Boolean,
    isSuccess: Boolean,
    onEmailChange: (String) -> Unit,
    onSubmitClick: () -> Unit,
    onBackClick: () -> Unit
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
            modifier = Modifier.padding(28.dp)
        ) {
            // Back Button
            IconButton(
                onClick = onBackClick,
                modifier = Modifier.align(Alignment.Start)
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = V8idColors.Purple.DeepPurple
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (isSuccess) {
                // Success State
                SuccessContent()
            } else {
                // Form State
                Text(
                    text = "Forgot Password?",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.Purple.DarkNavy
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Enter your email address and we'll send you a link to reset your password",
                    fontSize = 14.sp,
                    color = V8idColors.Purple.Indigo
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Email Field
                Text(
                    text = "Email Address",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = V8idColors.Purple.DeepPurple,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = onEmailChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "you@example.com",
                            color = V8idColors.Purple.LightPurple
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = "Email",
                            tint = V8idColors.Purple.VibrantPurpleAlt
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = V8idColors.Purple.VibrantPurpleAlt,
                        unfocusedBorderColor = V8idColors.Purple.VeryLightPurple,
                        focusedContainerColor = V8idColors.Purple.SubtlePurpleTint,
                        unfocusedContainerColor = V8idColors.Purple.SubtlePurpleTint,
                        focusedTextColor = V8idColors.Purple.DarkNavy,
                        unfocusedTextColor = V8idColors.Purple.DarkNavy,
                        cursorColor = V8idColors.Purple.VibrantPurpleAlt
                    )
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Submit Button
                Button(
                    onClick = onSubmitClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    enabled = !isSubmitting && email.isNotBlank() && android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = V8idColors.Purple.VibrantPurple,
                        disabledContainerColor = V8idColors.Purple.VeryLightPurple
                    ),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 4.dp,
                        pressedElevation = 8.dp
                    )
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = V8idColors.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "Send Reset Link",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = V8idColors.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SuccessContent() {
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
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = V8idColors.Purple.DarkNavy
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "If an account with that email exists, a password reset link has been sent.",
            fontSize = 14.sp,
            color = V8idColors.Purple.Indigo,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ForgotPasswordFloatingOrbs() {
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
private fun ForgotPasswordLogoSection() {
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
