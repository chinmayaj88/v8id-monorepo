package com.v8idcloud.core.ui.components

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.v8idcloud.core.common.FileItem
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * A reusable file item card with swipe actions
 */
@Composable
fun FileItemCard(
    file: FileItem,
    iconSize: Dp = 48.dp,
    isRevealed: Boolean = false,
    onExpand: () -> Unit = {},
    onCollapse: () -> Unit = {},
    onDownload: () -> Unit = {},
    onDelete: () -> Unit = {},
    onShare: () -> Unit = {},
    onMoreClick: () -> Unit = {}
) {
    // Menu width - fixed to ensure it doesn't go "out of view"
    val menuWidth = 160.dp

    // Smooth animation for the swipe offset
    val offset by animateDpAsState(
        targetValue = if (isRevealed) -menuWidth else 0.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "swipeOffset"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min),
        contentAlignment = Alignment.CenterEnd
    ) {
        // Swipe actions background (Revealed buttons)
        Surface(
            modifier = Modifier
                .padding(end = 8.dp)
                .width(menuWidth)
                .height(IntrinsicSize.Min), // Match height of parent
            color = Color.White.copy(alpha = 0.9f), // Strong white background for visibility
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                ActionIconButton(
                    icon = Icons.Outlined.Download, 
                    color = V8idColors.Purple.VibrantPurple,
                    onClick = { 
                        onCollapse()
                        onDownload() 
                    }
                )
                ActionIconButton(
                    icon = Icons.Outlined.Link, 
                    color = V8idColors.Purple.Indigo,
                    onClick = { 
                        onCollapse()
                        onShare() 
                    }
                )
                ActionIconButton(
                    icon = Icons.Outlined.Delete, 
                    color = V8idColors.Semantic.Error,
                    onClick = { 
                        onCollapse()
                        onDelete() 
                    }
                )
            }
        }

        // Main card content (Foreground)
        Surface(
            modifier = Modifier
                .offset(x = offset)
                .fillMaxWidth()
                .pointerInput(file.id) {
                    detectHorizontalDragGestures { change, dragAmount ->
                        change.consume()
                        if (dragAmount < -15) onExpand() // Swipe left to reveal
                        if (dragAmount > 15) onCollapse() // Swipe right to hide
                    }
                },
            shape = RoundedCornerShape(16.dp),
            color = V8idColors.UI.Surface,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // File Icon / Thumbnail
                Surface(
                    modifier = Modifier.size(iconSize),
                    shape = RoundedCornerShape(10.dp),
                    color = V8idColors.UI.SearchBackground
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        if (file.thumbnailUrl != null) {
                            AsyncImage(
                                model = file.thumbnailUrl,
                                contentDescription = file.name,
                                modifier = Modifier.fillMaxSize()
                                    .clip(RoundedCornerShape(10.dp))
                            )
                        } else {
                            Icon(
                                imageVector = file.icon,
                                contentDescription = file.name,
                                modifier = Modifier.size(iconSize * 0.5f),
                                tint = V8idColors.Purple.VibrantPurple
                            )
                        }
                    }
                }

                // File Info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = file.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${file.size} • ${file.timeAgo}",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }

                IconButton(onClick = onMoreClick) {
                    Icon(
                        imageVector = Icons.Outlined.MoreVert,
                        contentDescription = "More",
                        tint = V8idColors.UI.IconTint
                    )
                }
            }
        }
    }
}


