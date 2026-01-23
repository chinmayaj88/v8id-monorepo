package com.v8idcloud.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Top header with user profile information and storage status
 * Styled to match Dropbox-style design
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
                    .size(56.dp),
                contentAlignment = Alignment.Center
            ) {
                // Background Ring (Storage) - Green progress ring
                androidx.compose.material3.CircularProgressIndicator(
                    progress = { storagePercentage },
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF4CAF50), // Green progress ring
                    trackColor = Color(0xFFE8F5E9), // Light green track
                    strokeWidth = 3.dp
                )

                // Profile Photo
                Surface(
                    modifier = Modifier.size(44.dp),
                    shape = CircleShape,
                    color = Color(0xFFE8F5E9) // Light green background for avatar
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
                                color = Color(0xFF2E7D32) // Dark green text
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = "HI, $userName",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.UI.TextPrimary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Storage Used: ${(storagePercentage * 100).toInt()}%",
                    fontSize = 13.sp,
                    color = V8idColors.UI.TextSecondary
                )
            }
        }

        // Notification Bell with circular background
        Surface(
            modifier = Modifier.size(44.dp),
            shape = CircleShape,
            color = V8idColors.UI.Surface,
            shadowElevation = 2.dp,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                V8idColors.UI.TextTertiary.copy(alpha = 0.2f)
            )
        ) {
            Box(
                modifier = Modifier.fillMaxSize().clickable { onNotificationClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = "Notifications",
                    tint = V8idColors.UI.TextPrimary,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }
}

/**
 * A small chip showing summary counts
 * Gray/silver style to match Dropbox design
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
                color = Color(0xFFF0F0F0), // Light gray background
                shape = RoundedCornerShape(20.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "$fileCount Files",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = V8idColors.UI.TextSecondary
            )
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(V8idColors.UI.TextTertiary)
            )
            Text(
                text = "$folderCount Folder",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = V8idColors.UI.TextSecondary
            )
        }
    }
}

/**
 * Promotional card for Viewed Links section
 * Yellow/cream colored card with "See All" button - matches Dropbox design
 */
@Composable
fun ViewedLinksCard(
    modifier: Modifier = Modifier,
    onSeeAllClick: () -> Unit = {}
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color(0xFFFFF8DC), // Cream/yellow color
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Viewed Links",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2D2D3A)
                )
                
                Text(
                    text = "Links you've previously\nviewed show up here.",
                    fontSize = 14.sp,
                    color = Color(0xFF5A5A6A),
                    lineHeight = 20.sp
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // See All Button
                Surface(
                    modifier = Modifier
                        .clickable { onSeeAllClick() },
                    shape = RoundedCornerShape(24.dp),
                    color = Color.White,
                    shadowElevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "See All",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF2D2D3A)
                        )
                        Surface(
                            modifier = Modifier.size(28.dp),
                            shape = CircleShape,
                            color = Color(0xFF1A1A1A)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = "See All",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
            
            // Placeholder for illustration (cloud icon representation)
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .padding(start = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                // Cloud icon as placeholder for illustration
                Icon(
                    imageVector = Icons.Outlined.Cloud,
                    contentDescription = null,
                    tint = Color(0xFFE0E0E0),
                    modifier = Modifier.size(60.dp)
                )
            }
        }
    }
}
