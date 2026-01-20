package com.v8idcloud.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Top header with user profile information and storage status
 */
@Composable
fun ProfileHeader(
    userName: String,
    storagePercentage: Float,
    profileImageUrl: String? = null,
    onProfileClick: () -> Unit = {},
    onNotificationClick: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Profile Image with Storage Ring
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clickable { onLogout() }, // Tap profile to logout as per previous logic
                contentAlignment = Alignment.Center
            ) {
                // Background Ring (Storage)
                androidx.compose.material3.CircularProgressIndicator(
                    progress = storagePercentage,
                    modifier = Modifier.fillMaxSize(),
                    color = V8idColors.Purple.VibrantPurple,
                    trackColor = V8idColors.Purple.SubtlePurpleTint,
                    strokeWidth = 3.dp
                )
                
                // Profile Photo
                Surface(
                    modifier = Modifier.size(44.dp),
                    shape = CircleShape,
                    color = V8idColors.UI.SearchBackground
                ) {
                    if (profileImageUrl != null) {
                        AsyncImage(
                            model = profileImageUrl,
                            contentDescription = "Profile",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = userName.take(1).uppercase(),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = V8idColors.Purple.VibrantPurple
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    text = "Hello,",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f),
                    style = androidx.compose.ui.text.TextStyle(
                        shadow = androidx.compose.ui.graphics.Shadow(
                            color = Color.Black.copy(alpha = 0.3f),
                            offset = androidx.compose.ui.geometry.Offset(2f, 2f),
                            blurRadius = 4f
                        )
                    )
                )
                Text(
                    text = userName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    style = androidx.compose.ui.text.TextStyle(
                        shadow = androidx.compose.ui.graphics.Shadow(
                            color = Color.Black.copy(alpha = 0.4f),
                            offset = androidx.compose.ui.geometry.Offset(2f, 2f),
                            blurRadius = 6f
                        )
                    )
                )
            }
        }

        Surface(
            modifier = Modifier.size(44.dp),
            shape = CircleShape,
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Box(
                modifier = Modifier.fillMaxSize().clickable { onNotificationClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = "Notifications",
                    tint = Color.Black,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}

/**
 * A small chip showing summary counts
 */
@Composable
fun FileSummaryChip(
    fileCount: Int,
    folderCount: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .wrapContentSize()
            .background(
                brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF6B4EE6),
                        Color(0xFF8B5CF6)
                    )
                ),
                shape = RoundedCornerShape(20.dp)
            )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "$fileCount Files",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.6f))
            )
            Text(
                text = "$folderCount Folders",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
        }
    }
}
