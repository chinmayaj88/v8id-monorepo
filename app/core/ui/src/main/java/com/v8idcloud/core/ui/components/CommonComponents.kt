package com.v8idcloud.core.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * A stylized heading with a gradient brand name
 */
@Composable
fun GradientHeading(
    modifier: Modifier = Modifier,
    screenWidth: Int
) {
    val gradientColors = listOf(
        V8idColors.Gradient.LightLavender,
        V8idColors.Gradient.VibrantPurple,
        V8idColors.Gradient.RoyalBlue,
        V8idColors.Gradient.DeepNavy
    )

    // Dynamic font size calculation (approx 8% of screen width)
    // Coerced to be reasonable (between 24sp and 34sp)
    val dynamicFontSize = (screenWidth * 0.08).coerceIn(20.0, 36.0).sp

    Text(
        text = buildAnnotatedString {
            append("Save With ")
            withStyle(
                style = SpanStyle(
                    brush = Brush.linearGradient(
                        colors = gradientColors,
                        start = Offset(0f, 0f),
                        end = Offset(800f, 0f)
                    ),
                    fontWeight = FontWeight.Bold
                )
            ) {
                append("V8id")
            }
            append(" Cloud")
        },
        fontSize = dynamicFontSize,
        fontWeight = FontWeight.Bold,
        color = V8idColors.UI.TextPrimary,
        maxLines = 1,
        softWrap = false,
        overflow = androidx.compose.ui.text.style.TextOverflow.Visible,
        modifier = modifier
    )
}
