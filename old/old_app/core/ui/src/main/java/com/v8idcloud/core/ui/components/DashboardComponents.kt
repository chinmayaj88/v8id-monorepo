package com.v8idcloud.core.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Top header with user profile information and storage status
 * Styled with a green progress ring around the profile photo
 */
@Composable
fun ProfileHeader(
    userName: String,
    storagePercentage: Float,
    profileImageUrl: String? = null,
    onProfileClick: () -> Unit = {}
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
                    .clickable { onProfileClick() },
                contentAlignment = Alignment.Center
            ) {
                // Storage progress ring
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
                    color = Color(0xFFE8F5E9)
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
                                color = Color(0xFF2E7D32)
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
    }
}
