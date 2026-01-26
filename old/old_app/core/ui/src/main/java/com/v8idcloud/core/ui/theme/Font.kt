package com.v8idcloud.core.ui.theme

import androidx.compose.ui.text.font.FontFamily

/**
 * Urbanist Font Family
 * Using system default as fallback (Urbanist can be added as font files later)
 * For now, using a similar sans-serif font that matches Urbanist characteristics
 * 
 * To add actual Urbanist font:
 * 1. Add font files to core/ui/src/main/res/font/
 * 2. Uncomment the code below and reference the font files
 */
val UrbanistFontFamily = FontFamily.Default // Will be replaced with actual Urbanist font files

// If you have Urbanist font files, uncomment and add them to res/font/
/*
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontWeight
import com.v8idcloud.core.ui.R

val UrbanistFontFamily = FontFamily(
    Font(R.font.urbanist_light, FontWeight.Light),
    Font(R.font.urbanist_regular, FontWeight.Normal),
    Font(R.font.urbanist_medium, FontWeight.Medium),
    Font(R.font.urbanist_semibold, FontWeight.SemiBold),
    Font(R.font.urbanist_bold, FontWeight.Bold),
)
*/
