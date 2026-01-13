package com.v8idcloud.core.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * v8id Cloud Color System
 * Exact color palette matching design specifications
 * 
 * Color Palette:
 * - White: #FFFFFF (Primary text, icons)
 * - Light Gray: #A5A5A5 (Secondary text)
 * - Primary Blue: #5883F0 (Buttons, accents)
 * - Success Green: #00FF4C (Success states, highlights)
 * - Dark Blue Background: Deep dark blue with gradient
 * 
 * Purple Theme Colors (for bg1 background):
 * - Vibrant Purple: #7C3AED & #8B5CF6 (main accent, buttons, icons)
 * - Indigo: #6366F1 (links, secondary text)
 * - Deep Purple: #4C1D95 (labels, primary text)
 * - Dark Navy: #1E1B4B (headings)
 * - Light Purple: #A78BFA (placeholders)
 * - Very Light Purple: #DDD6FE (borders, disabled states)
 * - Subtle Purple Tint: #FAF5FF (input backgrounds)
 */
object V8idColors {
    // Exact Design Colors
    val White = Color(0xFFFFFFFF)
    val LightGray = Color(0xFFA5A5A5)
    val PrimaryBlue = Color(0xFF5883F0)
    val SuccessGreen = Color(0xFF00FF4C)
    
    // Dark Background Colors (matching image)
    val DarkBlueBackground = Color(0xFF0A1628) // Deep dark blue
    val DarkBlueSurface = Color(0xFF1A2332) // Slightly lighter for surfaces
    val DarkBlueGradientStart = Color(0xFF0A1628)
    val DarkBlueGradientEnd = Color(0xFF1A2B3D)
    
    // Button Colors
    val PrimaryButtonBlue = PrimaryBlue
    val SecondaryButtonGray = Color(0xFF2A3441) // Dark gray for secondary buttons
    
    // Text Colors
    val PrimaryText = White
    val SecondaryText = LightGray
    
    // Purple Theme Colors (for bg1 background)
    object Purple {
        // Primary Colors
        val VibrantPurple = Color(0xFF7C3AED) // Main accent, buttons
        val VibrantPurpleAlt = Color(0xFF8B5CF6) // Alternative vibrant purple for icons
        val Indigo = Color(0xFF6366F1) // Links, secondary text
        val DeepPurple = Color(0xFF4C1D95) // Labels, primary text
        val DarkNavy = Color(0xFF1E1B4B) // Headings
        
        // Light Variants
        val LightPurple = Color(0xFFA78BFA) // Placeholders
        val VeryLightPurple = Color(0xFFDDD6FE) // Borders, disabled states
        val SubtlePurpleTint = Color(0xFFFAF5FF) // Input backgrounds
    }
    
    // Semantic Colors
    object Semantic {
        val Error = Color(0xFFBA1A1A)
        val ErrorContainer = Color(0xFFFFDAD6)
        val OnError = White
        val OnErrorContainer = Color(0xFF410002)
        
        val Success = SuccessGreen
        val Warning = Color(0xFFFF9800)
        val Info = PrimaryBlue
    }
}
