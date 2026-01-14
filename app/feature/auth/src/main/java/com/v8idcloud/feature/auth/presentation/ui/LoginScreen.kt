package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
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
import com.v8idcloud.feature.auth.presentation.viewmodel.TotpViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.TotpUiState
import kotlinx.coroutines.launch
import com.v8idcloud.feature.auth.R


@Composable
fun LoginScreen(
  navController: NavHostController,
  viewModel: LoginViewModel = hiltViewModel(),
  totpViewModel: TotpViewModel = hiltViewModel()
) {
  val uiState by viewModel.uiState.collectAsState()
  val totpUiState by totpViewModel.uiState.collectAsState()
  val snackbarHostState = remember { SnackbarHostState() }
  val scope = rememberCoroutineScope()

  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }
  var rememberMe by remember { mutableStateOf(false) }
  var passwordVisible by remember { mutableStateOf(false) }

  // Track if TOTP verification is required
  val requiresTotp = uiState is LoginUiState.RequiresTotp

  // Handle TOTP success - navigate to home
  LaunchedEffect(totpUiState) {
    when (totpUiState) {
      is TotpUiState.Success -> {
        navController.navigate("home") {
          popUpTo("auth/login") { inclusive = true }
        }
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

  // Show TOTP error messages
  LaunchedEffect(totpUiState) {
    val currentState = totpUiState
    if (currentState is TotpUiState.Error) {
      scope.launch {
        snackbarHostState.showSnackbar(
          message = currentState.message,
          duration = SnackbarDuration.Short
        )
        totpViewModel.resetState()
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
          .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
      ) {
        // Logo Section
        LogoSection()

        // Animated transition between Login and TOTP
        AnimatedContent(
          targetState = requiresTotp,
          transitionSpec = {
            if (targetState) {
              // Slide in from right when showing TOTP
              slideInHorizontally(
                initialOffsetX = { fullWidth -> fullWidth },
                animationSpec = spring(
                  dampingRatio = Spring.DampingRatioMediumBouncy,
                  stiffness = Spring.StiffnessMedium
                )
              ) + fadeIn(
                animationSpec = tween(300)
              ) togetherWith slideOutHorizontally(
                targetOffsetX = { fullWidth -> -fullWidth },
                animationSpec = spring(
                  dampingRatio = Spring.DampingRatioMediumBouncy,
                  stiffness = Spring.StiffnessMedium
                )
              ) + fadeOut(
                animationSpec = tween(300)
              )
            } else {
              // Slide in from left when showing Login
              slideInHorizontally(
                initialOffsetX = { fullWidth -> -fullWidth },
                animationSpec = spring(
                  dampingRatio = Spring.DampingRatioMediumBouncy,
                  stiffness = Spring.StiffnessMedium
                )
              ) + fadeIn(
                animationSpec = tween(300)
              ) togetherWith slideOutHorizontally(
                targetOffsetX = { fullWidth -> fullWidth },
                animationSpec = spring(
                  dampingRatio = Spring.DampingRatioMediumBouncy,
                  stiffness = Spring.StiffnessMedium
                )
              ) + fadeOut(
                animationSpec = tween(300)
              )
            }
          },
          label = "login_totp_transition"
        ) { showTotp ->
          if (showTotp) {
            // TOTP Verification Card
            TotpVerificationCard(
              totpViewModel = totpViewModel,
              isLoading = totpUiState is TotpUiState.Loading,
              onBackClick = {
                viewModel.resetState()
                totpViewModel.resetState()
              }
            )
          } else {
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
          }
        }
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
          focusedTextColor = V8idColors.Purple.DarkNavy,
          unfocusedTextColor = V8idColors.Purple.DarkNavy,
          cursorColor = V8idColors.Purple.VibrantPurpleAlt
        )
      )

        Spacer(modifier = Modifier.height(16.dp))

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
          focusedTextColor = V8idColors.Purple.DarkNavy,
          unfocusedTextColor = V8idColors.Purple.DarkNavy,
          cursorColor = V8idColors.Purple.VibrantPurpleAlt
        )
      )

      Spacer(modifier = Modifier.height(12.dp))

      // Remember Me & Forgot Password - Compact side-by-side layout
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        // Remember Me
        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier.weight(1f, fill = false)
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
            fontSize = 12.sp,
            color = V8idColors.Purple.DeepPurple
          )
        }

        // Forgot Password
        TextButton(
          onClick = onForgotPasswordClick,
          contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
        ) {
          Text(
            text = "Forgot?",
            fontSize = 12.sp,
            color = V8idColors.Purple.Indigo,
            fontWeight = FontWeight.Medium
          )
        }
      }

        Spacer(modifier = Modifier.height(20.dp))

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

      Spacer(modifier = Modifier.height(16.dp))

      // Privacy Statement
      Text(
        text = "By logging in, you agree to our updated terms and service and privacy policy",
        fontSize = 10.sp,
        color = V8idColors.Purple.Indigo,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth(),
        lineHeight = 14.sp
      )

      // Spacer(modifier = Modifier.height(20.dp))
    }
  }
}

@Composable
private fun TotpVerificationCard(
  totpViewModel: TotpViewModel,
  isLoading: Boolean,
  onBackClick: () -> Unit
) {
  var totpCode by remember { mutableStateOf("") }
  var isFocused by remember { mutableStateOf(false) }
  val focusRequester = remember { FocusRequester() }
  val focusManager = LocalFocusManager.current

  // Auto-focus on mount
  LaunchedEffect(Unit) {
    focusRequester.requestFocus()
  }

  // Auto-submit when 6 digits entered
  LaunchedEffect(totpCode) {
    if (totpCode.length == 6 && totpCode.all { it.isDigit() }) {
      focusManager.clearFocus()
      if (!isLoading) {
        totpViewModel.verifyTotp(totpCode)
      }
    }
  }

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

      // Title
      Text(
        text = "Two-Factor Authentication",
        fontSize = 26.sp,
        fontWeight = FontWeight.Bold,
        color = V8idColors.Purple.DarkNavy
      )

      Spacer(modifier = Modifier.height(6.dp))

      Text(
        text = "Enter the 6-digit code from your authenticator app",
        fontSize = 14.sp,
        color = V8idColors.Purple.Indigo,
        textAlign = TextAlign.Center
      )

      Spacer(modifier = Modifier.height(32.dp))

      // TOTP Code Input
      TotpCodeInputField(
        code = totpCode,
        onCodeChange = { newCode ->
          // Only allow digits and limit to 6 characters
          if (newCode.all { it.isDigit() } && newCode.length <= 6) {
            totpCode = newCode
          }
        },
        isFocused = isFocused,
        onFocusChanged = { isFocused = it },
        focusRequester = focusRequester
      )

      Spacer(modifier = Modifier.height(24.dp))

      // Verify Button
      Button(
        onClick = {
          if (totpCode.length == 6) {
            totpViewModel.verifyTotp(totpCode)
          }
        },
        modifier = Modifier
          .fillMaxWidth()
          .height(54.dp),
        enabled = !isLoading && totpCode.length == 6,
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
            text = "Verify",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = V8idColors.White
          )
        }
      }
    }
  }
}

@Composable
private fun TotpCodeInputField(
  code: String,
  onCodeChange: (String) -> Unit,
  isFocused: Boolean,
  onFocusChanged: (Boolean) -> Unit,
  focusRequester: FocusRequester
) {
  val focusManager = LocalFocusManager.current
  val scale by animateFloatAsState(
    targetValue = if (isFocused) 1.02f else 1f,
    animationSpec = spring(
      dampingRatio = Spring.DampingRatioMediumBouncy,
      stiffness = Spring.StiffnessMedium
    ),
    label = "totp_scale"
  )

  Box(
    modifier = Modifier
      .fillMaxWidth()
      .height(72.dp)
      .scale(scale)
      .clip(RoundedCornerShape(16.dp))
      .background(
        color = V8idColors.Purple.SubtlePurpleTint,
        shape = RoundedCornerShape(16.dp)
      )
      .border(
        width = if (isFocused) 2.dp else 1.dp,
        color = if (isFocused) V8idColors.Purple.VibrantPurpleAlt else V8idColors.Purple.VeryLightPurple,
        shape = RoundedCornerShape(16.dp)
      ),
    contentAlignment = Alignment.Center
  ) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .height(72.dp)
        .padding(horizontal = 12.dp),
      horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
      verticalAlignment = Alignment.CenterVertically
    ) {
      repeat(6) { index ->
        val digit = code.getOrNull(index)?.toString() ?: ""
        val isFilled = digit.isNotEmpty()
        val isCurrent = index == code.length && isFocused

        Box(
          modifier = Modifier
            .weight(1f, fill = false)
            .aspectRatio(1f)
            .height(48.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(
              color = if (isFilled) {
                V8idColors.Purple.VibrantPurpleAlt.copy(alpha = 0.1f)
              } else {
                V8idColors.Purple.VeryLightPurple
              }
            )
            .border(
              width = if (isCurrent) 2.dp else 1.dp,
              color = if (isCurrent) {
                V8idColors.Purple.VibrantPurpleAlt
              } else if (isFilled) {
                V8idColors.Purple.VibrantPurpleAlt.copy(alpha = 0.3f)
              } else {
                V8idColors.Purple.VeryLightPurple
              },
              shape = RoundedCornerShape(12.dp)
            ),
          contentAlignment = Alignment.Center
        ) {
          if (isFilled) {
            Text(
              text = digit,
              fontSize = 22.sp,
              fontWeight = FontWeight.Bold,
              color = V8idColors.Purple.DarkNavy
            )
          } else if (isCurrent) {
            // Cursor indicator
            Box(
              modifier = Modifier
                .width(2.dp)
                .height(20.dp)
                .background(V8idColors.Purple.VibrantPurpleAlt)
            )
          }
        }
      }
    }

    // Hidden text field for input
    androidx.compose.foundation.text.BasicTextField(
      value = code,
      onValueChange = onCodeChange,
      textStyle = androidx.compose.ui.text.TextStyle(
        color = Color.Transparent,
        fontSize = 24.sp,
        fontWeight = FontWeight.Bold
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
        .height(72.dp)
        .focusRequester(focusRequester)
        .onFocusChanged { focusState ->
          onFocusChanged(focusState.isFocused)
        },
      singleLine = true,
      cursorBrush = androidx.compose.ui.graphics.SolidColor(V8idColors.Purple.VibrantPurpleAlt)
    )
  }
}
