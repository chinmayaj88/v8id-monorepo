package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.LoginUiState
import kotlinx.coroutines.launch
import com.v8idcloud.feature.auth.R


@Composable
fun LoginScreen(
  navController: NavHostController,
  viewModel: LoginViewModel = hiltViewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  val snackbarHostState = remember { SnackbarHostState() }
  val scope = rememberCoroutineScope()

  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }
  var rememberMe by remember { mutableStateOf(false) }
  var passwordVisible by remember { mutableStateOf(false) }

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

      // Floating Orbs for additional depth
      FloatingOrbs()

      // Content
      Column(
        modifier = Modifier
          .fillMaxSize()
          .verticalScroll(rememberScrollState())
          .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
      ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Logo Section
        LogoSection()

        Spacer(modifier = Modifier.height(48.dp))

        // Login Card
        LoginCard(
          email = email,
          password = password,
          rememberMe = rememberMe,
          passwordVisible = passwordVisible,
          isLoading = uiState is LoginUiState.Loading,
          onEmailChange = { email = it },
          onPasswordChange = { password = it },
          onRememberMeChange = { rememberMe = it },
          onPasswordVisibilityChange = { passwordVisible = !passwordVisible },
          onLoginClick = {
            viewModel.login(email, password)
          },
          onForgotPasswordClick = {
            navController.navigate("auth/forgot-password")
          }
        )
        Spacer(modifier = Modifier.height(32.dp))
      }
    }
  }
}

@Composable
private fun FloatingOrbs() {
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
private fun LogoSection() {
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

    Spacer(modifier = Modifier.height(16.dp))

    // Brand Text
    Text(
      text = "V8id Cloud",
      fontSize = 36.sp,
      fontWeight = FontWeight.Bold,
      color = Color.White,
      letterSpacing = (-0.5).sp
    )

    Spacer(modifier = Modifier.height(8.dp))

    Text(
      text = "Secure Cloud Identity Platform",
      fontSize = 13.sp,
      color = V8idColors.Purple.LightPurple,
      fontWeight = FontWeight.Light
    )
  }
}

@Composable
private fun LoginCard(
  email: String,
  password: String,
  rememberMe: Boolean,
  passwordVisible: Boolean,
  isLoading: Boolean,
  onEmailChange: (String) -> Unit,
  onPasswordChange: (String) -> Unit,
  onRememberMeChange: (Boolean) -> Unit,
  onPasswordVisibilityChange: () -> Unit,
  onLoginClick: () -> Unit,
  onForgotPasswordClick: () -> Unit,
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
      // Welcome Text
      Text(
        text = "Welcome back",
        fontSize = 26.sp,
        fontWeight = FontWeight.Bold,
        color = V8idColors.Purple.DarkNavy
      )

      Spacer(modifier = Modifier.height(6.dp))

      Text(
        text = "Sign in to continue to your account",
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
          cursorColor = V8idColors.Purple.VibrantPurpleAlt
        )
      )

      Spacer(modifier = Modifier.height(18.dp))

      // Password Field
      Text(
        text = "Password",
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium,
        color = V8idColors.Purple.DeepPurple,
        modifier = Modifier.padding(bottom = 8.dp)
      )

      OutlinedTextField(
        value = password,
        onValueChange = onPasswordChange,
        modifier = Modifier.fillMaxWidth(),
        placeholder = {
          Text(
            "Password",
            color = V8idColors.Purple.LightPurple
          )
        },
        leadingIcon = {
          Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = "Password",
            tint = V8idColors.Purple.VibrantPurpleAlt
          )
        },
        trailingIcon = {
          IconButton(onClick = onPasswordVisibilityChange) {
            Icon(
              imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
              contentDescription = if (passwordVisible) "Hide password" else "Show password",
              tint = V8idColors.Purple.VibrantPurpleAlt
            )
          }
        },
        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
          focusedBorderColor = V8idColors.Purple.VibrantPurpleAlt,
          unfocusedBorderColor = V8idColors.Purple.VeryLightPurple,
          focusedContainerColor = V8idColors.Purple.SubtlePurpleTint,
          unfocusedContainerColor = V8idColors.Purple.SubtlePurpleTint,
          cursorColor = V8idColors.Purple.VibrantPurpleAlt
        )
      )

      Spacer(modifier = Modifier.height(16.dp))

      // Remember Me & Forgot Password Row
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically
        ) {
          Switch(
            checked = rememberMe,
            onCheckedChange = onRememberMeChange,
            colors = SwitchDefaults.colors(
              checkedThumbColor = V8idColors.White,
              checkedTrackColor = V8idColors.Purple.VibrantPurpleAlt,
              uncheckedThumbColor = V8idColors.White,
              uncheckedTrackColor = V8idColors.Purple.VeryLightPurple,
              checkedBorderColor = V8idColors.Purple.VibrantPurpleAlt,
              uncheckedBorderColor = V8idColors.Purple.VeryLightPurple

            )
          )
          Spacer(modifier = Modifier.width(8.dp))
          Text(
            text = "Remember me",
            fontSize = 13.sp,
            color = V8idColors.Purple.DeepPurple
          )
        }

        TextButton(onClick = onForgotPasswordClick) {
          Text(
            text = "Forgot Password?",
            fontSize = 13.sp,
            color = V8idColors.Purple.Indigo,
            fontWeight = FontWeight.Medium
          )
        }
      }

      Spacer(modifier = Modifier.height(24.dp))

      // Login Button
      Button(
        onClick = onLoginClick,
        modifier = Modifier
          .fillMaxWidth()
          .height(54.dp),
        enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
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
        if (isLoading) {
          CircularProgressIndicator(
            modifier = Modifier.size(24.dp),
            color = V8idColors.White,
            strokeWidth = 2.dp
          )
        } else {
          Text(
            text = "Log in",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = V8idColors.White
          )
        }
      }

      Spacer(modifier = Modifier.height(20.dp))

      // Privacy Statement
      Text(
        text = "By logging in, you agree to our updated terms and service and privacy policy",
        fontSize = 11.sp,
        color = V8idColors.Purple.Indigo,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth(),
        lineHeight = 16.sp
      )

      // Spacer(modifier = Modifier.height(20.dp))
    }
  }
}
