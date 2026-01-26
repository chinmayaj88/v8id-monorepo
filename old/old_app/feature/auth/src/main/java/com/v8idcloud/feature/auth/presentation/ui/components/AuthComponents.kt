package com.v8idcloud.feature.auth.presentation.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Shared UI components for authentication screens
 * Extracted common components to reduce code duplication
 * Following DRY (Don't Repeat Yourself) principle
 */

/**
 * Shared UI components for authentication screens
 * Extracted common components to reduce code duplication
 */

/**
 * Logo Section Component
 * Displays the V8id Cloud logo with animated gradient text
 */
@Composable
fun AuthLogoSection(
    modifier: Modifier = Modifier,
    iconSize: androidx.compose.ui.unit.Dp = 48.dp,
    animate: Boolean = true
) {
    val logoScale = if (animate) {
        val infiniteTransition = rememberInfiniteTransition(label = "logo_pulse")
        infiniteTransition.animateFloat(
            initialValue = 1f,
            targetValue = 1.05f,
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "logo_scale"
        ).value
    } else {
        1f
    }
    
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(tween(600)) + slideInVertically(
            initialOffsetY = { -30 },
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        ),
        modifier = modifier
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.scale(logoScale)
        ) {
            Icon(
                imageVector = Icons.Default.Cloud,
                contentDescription = "Cloud",
                tint = V8idColors.White,
                modifier = Modifier.size(iconSize)
            )
            
            Text(
                text = buildAnnotatedString {
                    withStyle(
                        style = SpanStyle(
                            brush = Brush.linearGradient(
                                colors = listOf(
                                    Color(0xFF5883F0),
                                    Color(0xFF7BA3FF),
                                    V8idColors.White
                                )
                            ),
                            fontWeight = FontWeight.Bold
                        )
                    ) {
                        append("V8id Cloud")
                    }
                },
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp
                )
            )
        }
    }
}

/**
 * Back Button Component
 * Reusable back button with animation
 */
@Composable
fun AuthBackButton(
    onClick: () -> Unit,
    text: String = "Back to login",
    modifier: Modifier = Modifier
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        label = "back_scale"
    )
    
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                isPressed = true
                onClick()
            },
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.ArrowBack,
            contentDescription = "Back",
            tint = V8idColors.White,
            modifier = Modifier
                .scale(scale)
                .size(24.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontSize = 16.sp
            ),
            color = V8idColors.White.copy(alpha = 0.9f)
        )
    }
}
