package com.v8idcloud.core.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.MoreVert
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * A card showing recent folders in a grid/row
 * Styled with soft lavender gradient to match Dropbox design
 */
@Composable
fun RecentFoldersCard(
    folders: List<FolderData>,
    iconSize: Dp = 56.dp,
    title: String = "Recent Files & Folders",
    onMenuClick: () -> Unit = {}
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color.Transparent,
        shadowElevation = 0.dp
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.linearGradient(
                        colors = listOf(
                            Color(0xFFDDD6F0), // Light lavender
                            Color(0xFFE8D4F0), // Soft pink lavender
                            Color(0xFFD4C4E8)  // Slightly deeper lavender
                        )
                    ),
                    shape = RoundedCornerShape(24.dp)
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF2D2D3A) // Dark text for contrast
                    )
                    androidx.compose.material3.IconButton(onClick = onMenuClick) {
                        Icon(
                            imageVector = Icons.Outlined.Menu,
                            contentDescription = "Menu",
                            tint = Color(0xFF2D2D3A) // Dark icon for contrast
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Grid of folders
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    folders.forEach { folder ->
                        FolderItem(folder = folder, iconSize = iconSize)
                    }
                }
            }
        }
    }
}

/**
 * Individual folder item with icon and name
 * Uses dark text for visibility on light lavender background
 */
@Composable
fun FolderItem(
    folder: FolderData,
    iconSize: Dp = 56.dp,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Surface(
            modifier = Modifier.size(iconSize),
            shape = CircleShape,
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Icon(
                    imageVector = folder.icon,
                    contentDescription = folder.name,
                    modifier = Modifier.size(iconSize * 0.45f),
                    tint = folder.iconColor
                )
            }
        }

        Text(
            text = folder.name,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF2D2D3A) // Dark text
        )

        if (folder.size.isNotEmpty()) {
            Text(
                text = folder.size,
                fontSize = 10.sp,
                color = Color(0xFF5A5A6A) // Gray text
            )
        }
    }
}

/**
 * A full-row folder item with details and menu
 * Styled to match Dropbox design with tinted backgrounds
 */
@Composable
fun FolderRowItem(
    folder: FolderData,
    itemCount: Int? = null,
    onFolderClick: () -> Unit = {},
    onMoreClick: () -> Unit = {}
) {
    // Get background tint color based on folder icon color (very light version)
    val backgroundTintColor = folder.iconColor.copy(alpha = 0.08f)
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onFolderClick() },
        shape = RoundedCornerShape(20.dp),
        color = backgroundTintColor,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Folder Icon - Circular
            Surface(
                modifier = Modifier.size(44.dp),
                shape = CircleShape,
                color = folder.iconColor.copy(alpha = 0.15f)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = folder.icon,
                        contentDescription = folder.name,
                        modifier = Modifier.size(22.dp),
                        tint = folder.iconColor
                    )
                }
            }

            // Folder Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = folder.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.UI.TextPrimary
                )
                if (folder.size.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = folder.size,
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }
            }

            // Horizontal Three-dot Menu
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clickable { onMoreClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MoreHoriz,
                    contentDescription = "More",
                    tint = V8idColors.UI.TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
