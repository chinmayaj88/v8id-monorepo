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
