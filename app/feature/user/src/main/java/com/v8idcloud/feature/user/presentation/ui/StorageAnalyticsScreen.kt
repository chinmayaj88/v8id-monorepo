package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel

@Composable
fun StorageAnalyticsScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val analytics by viewModel.storageAnalytics.collectAsState()
    val error by viewModel.storageAnalyticsError.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadStorageAnalytics()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.DarkBlueBackground)
            .padding(24.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { navController.popBackStack() },
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        color = Color.White.copy(alpha = 0.1f),
                        shape = CircleShape
                    )
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Text(
                text = "Storage",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        if (analytics == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                if (error != null) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Error",
                            tint = V8idColors.Semantic.Error,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = error ?: "Unknown error",
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.loadStorageAnalytics() },
                            colors = ButtonDefaults.buttonColors(containerColor = V8idColors.PrimaryBlue)
                        ) {
                            Text("Retry")
                        }
                    }
                } else {
                    CircularProgressIndicator(color = V8idColors.PrimaryBlue)
                }
            }
        } else {
            val totalUsed = analytics!!.usedStorage ?: 0L
            val totalQuota = analytics!!.totalStorage ?: (10L * 1024 * 1024 * 1024)
            val percentage = if (totalQuota > 0) (totalUsed.toFloat() / totalQuota.toFloat()).coerceIn(0f, 1f) else 0f
            
            val breakdown = analytics!!.breakdownByType ?: emptyList()
            val images = breakdown.find { it.type == "IMAGE" }?.size ?: 0L
            val videos = breakdown.find { it.type == "VIDEO" }?.size ?: 0L
            val audio = breakdown.find { it.type == "AUDIO" }?.size ?: 0L
            val docs = breakdown.find { it.type == "DOCUMENT" }?.size ?: 0L
            val archives = breakdown.find { it.type == "ARCHIVE" }?.size ?: 0L
            val others = breakdown.find { it.type == "OTHER" }?.size ?: 0L

            // Storage Overview Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = V8idColors.DarkBlueSurface,
                shadowElevation = 8.dp
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${formatSize(totalUsed)} used of ${formatSize(totalQuota)}",
                        fontSize = 16.sp,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Circular Progress (Simplified as Box with thick border)
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(180.dp)
                    ) {
                        CircularProgressIndicator(
                            progress = 1f,
                            modifier = Modifier.size(180.dp),
                            color = Color.White.copy(alpha = 0.1f),
                            strokeWidth = 16.dp
                        )
                        CircularProgressIndicator(
                            progress = percentage,
                            modifier = Modifier.size(180.dp),
                            color = V8idColors.PrimaryBlue,
                            strokeWidth = 16.dp
                        )
                        
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${(percentage * 100).toInt()}%",
                                fontSize = 42.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Used",
                                fontSize = 14.sp,
                                color = V8idColors.LightGray
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                text = "Details",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                StorageCategoryItem("Images", images, Color(0xFF42A5F5), Icons.Outlined.Image)
                StorageCategoryItem("Videos", videos, Color(0xFFEF5350), Icons.Outlined.Videocam)
                StorageCategoryItem("Documents", docs, Color(0xFFFFCA28), Icons.Outlined.Description)
                StorageCategoryItem("Audio", audio, Color(0xFF66BB6A), Icons.Outlined.AudioFile)
                StorageCategoryItem("Others", others + archives, Color(0xFFBDBDBD), Icons.Outlined.Folder)
            }
        }
    }
}

@Composable
fun StorageCategoryItem(
    name: String,
    size: Long,
    color: Color,
    icon: ImageVector
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(color.copy(alpha = 0.2f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = name,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = name,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // tiny progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(2.dp))
            ) {
                // Determine usage scale relative to "some" max? 
                // Or just show full bar with color? Let's just show color bar as decoration
                // Actually, let's just show size text instead of bar for cleaner look
            }
        }
        
        Text(
            text = formatSize(size),
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            color = Color.White
        )
    }
}

fun formatSize(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val units = arrayOf("B", "KB", "MB", "GB", "TB")
    val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
    return "%.1f %s".format(
        bytes / Math.pow(1024.0, digitGroups.toDouble()),
        units[digitGroups]
    )
}
