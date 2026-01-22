package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(
                top = 16.dp + statusBarHeight,
                bottom = 32.dp
            ),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(44.dp),
                        shape = CircleShape,
                        color = V8idColors.UI.Surface,
                        border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { navController.popBackStack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = V8idColors.UI.TextPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Text(
                        text = "Storage",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                }
            }

            if (analytics == null) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(300.dp),
                        contentAlignment = Alignment.Center
                    ) {
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
                                    color = V8idColors.UI.TextSecondary
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { viewModel.loadStorageAnalytics() },
                                    colors = ButtonDefaults.buttonColors(containerColor = V8idColors.Purple.VibrantPurple)
                                ) {
                                    Text("Retry")
                                }
                            }
                        } else {
                            CircularProgressIndicator(color = V8idColors.Purple.VibrantPurple)
                        }
                    }
                }
            } else {
                val totalUsed = analytics!!.usedStorage ?: 0L
                val totalQuota = analytics!!.totalStorage ?: (10L * 1024 * 1024 * 1024)
                val usedPercentage = if (totalQuota > 0) (totalUsed.toFloat() / totalQuota.toFloat()).coerceIn(0f, 1f) else 0f
                val totalItems = analytics!!.breakdownByType?.sumOf { it.count ?: 0 } ?: 0
                
                // Exact UI Match for Storage Card
                item {
                    StorageOverviewCard(
                        totalUsed = totalUsed,
                        totalQuota = totalQuota,
                        percentage = usedPercentage,
                        totalItems = totalItems
                    )
                }
                
                // Breakdown Details
                item {
                    Text(
                        text = "Details",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                val breakdown = analytics!!.breakdownByType ?: emptyList()
                val imageStats = breakdown.find { it.type == "IMAGE" }
                val videoStats = breakdown.find { it.type == "VIDEO" }
                val docStats = breakdown.find { it.type == "DOCUMENT" }
                val musicStats = breakdown.find { it.type == "AUDIO" }
                val otherStats = breakdown.find { it.type == "OTHER" }
                val archiveStats = breakdown.find { it.type == "ARCHIVE" }

                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        StorageDetailRow(
                            name = "Images",
                            size = imageStats?.size ?: 0L,
                            count = imageStats?.count ?: 0,
                            icon = Icons.Outlined.Image,
                            color = Color(0xFF2196F3), // Blue
                            onClick = { navController.navigate("media?type=IMAGE") }
                        )
                        StorageDetailRow(
                            name = "Videos",
                            size = videoStats?.size ?: 0L,
                            count = videoStats?.count ?: 0,
                            icon = Icons.Outlined.Videocam,
                            color = Color(0xFFE91E63), // Pink
                             onClick = { navController.navigate("media?type=VIDEO") }
                        )
                        StorageDetailRow(
                            name = "Documents",
                            size = docStats?.size ?: 0L,
                            count = docStats?.count ?: 0,
                            icon = Icons.Outlined.Description,
                            color = Color(0xFFFFC107), // Amber
                             onClick = { navController.navigate("media?type=DOCUMENT") }
                        )
                        StorageDetailRow(
                            name = "Music",
                            size = musicStats?.size ?: 0L,
                            count = musicStats?.count ?: 0,
                            icon = Icons.Outlined.LibraryMusic,
                            color = Color(0xFF4CAF50), // Green
                             onClick = { navController.navigate("media?type=AUDIO") }
                        )
                        StorageDetailRow(
                            name = "Others",
                            size = (otherStats?.size ?: 0L) + (archiveStats?.size ?: 0L),
                            count = (otherStats?.count ?: 0) + (archiveStats?.count ?: 0),
                            icon = Icons.Outlined.Folder,
                            color = V8idColors.UI.TextTertiary,
                             onClick = { navController.navigate("media?type=OTHER") }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StorageOverviewCard(
    totalUsed: Long,
    totalQuota: Long,
    percentage: Float,
    totalItems: Int
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = V8idColors.UI.Surface,
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Top Section: Circle + Title
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Circular Progress (Left)
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(80.dp)
                ) {
                    CircularProgressIndicator(
                        progress = 1f,
                        modifier = Modifier.size(80.dp),
                        color = V8idColors.UI.SearchBackground,
                        strokeWidth = 10.dp,
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                    CircularProgressIndicator(
                        progress = percentage,
                        modifier = Modifier.size(80.dp),
                        color = Color(0xFF2D6AFA), // Match image blue
                        strokeWidth = 10.dp,
                        strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
                    )
                }
                
                Column {
                    Text(
                        text = "V8id Cloud",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Text(
                        text = "$totalItems items",
                        fontSize = 15.sp,
                        color = V8idColors.UI.TextSecondary
                    )
                }
            }
            
            // Middle Section: Horizontal Progress Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .background(V8idColors.UI.SearchBackground, RoundedCornerShape(5.dp))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(percentage)
                        .fillMaxHeight()
                        .background(Color(0xFF424242), RoundedCornerShape(5.dp)) // Dark gray bar like image
                )
            }
            
            // Bottom Section: Stats Labels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = formatSize(totalUsed),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Text(
                        text = "$totalItems items",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = formatSize(totalQuota),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Text(
                        text = "Free Space",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }
            }
        }
    }
}

@Composable
private fun StorageDetailRow(
    name: String,
    size: Long,
    count: Int,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = color.copy(alpha = 0.08f)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(12.dp),
                color = color.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = name,
                        tint = color,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.UI.TextPrimary
                )
                Text(
                    text = "$count files",
                    fontSize = 12.sp,
                    color = V8idColors.UI.TextTertiary
                )
            }
            
            Text(
                text = formatSize(size),
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = V8idColors.UI.TextPrimary
            )
        }
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
