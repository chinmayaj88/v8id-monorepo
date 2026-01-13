package com.v8idcloud.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

/**
 * v8id Cloud Theme
 * Enterprise theme system with dark mode support
 * Follows Material Design 3 guidelines
 */
private val DarkColorScheme = darkColorScheme(
    primary = V8idColors.PrimaryBlue,
    onPrimary = V8idColors.White,
    secondary = V8idColors.LightGray,
    onSecondary = V8idColors.White,
    tertiary = V8idColors.SuccessGreen,
    onTertiary = V8idColors.White,
    error = V8idColors.Semantic.Error,
    onError = V8idColors.Semantic.OnError,
    errorContainer = V8idColors.Semantic.ErrorContainer,
    onErrorContainer = V8idColors.Semantic.OnErrorContainer,
    background = V8idColors.DarkBlueBackground,
    onBackground = V8idColors.PrimaryText,
    surface = V8idColors.DarkBlueSurface,
    onSurface = V8idColors.PrimaryText,
    surfaceVariant = V8idColors.SecondaryButtonGray,
    onSurfaceVariant = V8idColors.SecondaryText,
    outline = V8idColors.LightGray.copy(alpha = 0.3f),
    outlineVariant = V8idColors.LightGray.copy(alpha = 0.1f)
)

@Composable
fun V8idTheme(
    content: @Composable () -> Unit
) = MaterialTheme(
    colorScheme = DarkColorScheme,
    typography = V8idTypography,
    content = content
)
