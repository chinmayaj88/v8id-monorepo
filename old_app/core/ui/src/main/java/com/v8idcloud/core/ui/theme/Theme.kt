package com.v8idcloud.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

/**
 * v8id Cloud Theme
 * Enterprise theme system with light mode support
 * Follows Material Design 3 guidelines
 */
private val LightColorScheme = lightColorScheme(
    primary = V8idColors.Purple.VibrantPurple,
    onPrimary = V8idColors.White,
    secondary = V8idColors.Purple.Indigo,
    onSecondary = V8idColors.White,
    tertiary = V8idColors.SuccessGreen,
    onTertiary = V8idColors.White,
    error = V8idColors.Semantic.Error,
    onError = V8idColors.Semantic.OnError,
    errorContainer = V8idColors.Semantic.ErrorContainer,
    onErrorContainer = V8idColors.Semantic.OnErrorContainer,
    background = V8idColors.UI.Background,
    onBackground = V8idColors.UI.TextPrimary,
    surface = V8idColors.UI.Surface,
    onSurface = V8idColors.UI.TextPrimary,
    surfaceVariant = V8idColors.UI.SearchBackground,
    onSurfaceVariant = V8idColors.UI.TextSecondary,
    outline = V8idColors.Purple.VeryLightPurple,
    outlineVariant = V8idColors.Purple.SubtlePurpleTint
)

@Composable
fun V8idTheme(
    content: @Composable () -> Unit
) = MaterialTheme(
    colorScheme = LightColorScheme,
    typography = V8idTypography,
    content = content
)
