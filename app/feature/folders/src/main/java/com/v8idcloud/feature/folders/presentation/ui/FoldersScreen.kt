package com.v8idcloud.feature.folders.presentation.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.ui.components.FolderRowItem

@Composable
fun FoldersScreen(navController: NavHostController) {
    // Mock folders data - in a real app this would come from a ViewModel
    val folders = remember {
        listOf(
            FolderData(id = "1", name = "Final UI Presentation", size = "1.5 GB", icon = Icons.Default.Slideshow, iconColor = Color(0xFF4CAF50)),
            FolderData(id = "2", name = "Client Files", size = "356 MB", icon = Icons.Default.Folder, iconColor = Color(0xFF2196F3)),
            FolderData(id = "3", name = "Documents", size = "10.5 GB", icon = Icons.Default.Archive, iconColor = Color(0xFFFFC107)),
            FolderData(id = "4", name = "Downloads", size = "15 GB", icon = Icons.Default.Download, iconColor = Color(0xFFE91E63)),
            FolderData(id = "5", name = "Apps", size = "4.2 GB", icon = Icons.Default.Apps, iconColor = Color(0xFF4CAF50))
        )
    }

    var searchQuery by remember { mutableStateOf("") }

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
                bottom = 96.dp
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header with Title and Action Icons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "V8id Cloud",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        // Upload Icon
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = V8idColors.UI.Surface,
                            border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize().clickable { /* Upload */ },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CloudUpload,
                                    contentDescription = "Upload",
                                    tint = V8idColors.UI.TextPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        
                        // Options Icon
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = V8idColors.UI.Surface,
                            border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize().clickable { /* Options */ },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CheckBoxOutlineBlank,
                                    contentDescription = "Options",
                                    tint = V8idColors.UI.TextPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Search Bar
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(24.dp),
                    color = V8idColors.UI.Surface,
                    border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Search,
                            contentDescription = null,
                            tint = V8idColors.UI.IconTint,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        BasicTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            singleLine = true,
                            textStyle = TextStyle(
                                fontSize = 15.sp,
                                color = V8idColors.UI.TextPrimary
                            ),
                            modifier = Modifier.weight(1f),
                            decorationBox = { innerTextField ->
                                if (searchQuery.isEmpty()) {
                                    Text(
                                        text = "Search",
                                        fontSize = 15.sp,
                                        color = V8idColors.UI.TextTertiary
                                    )
                                }
                                innerTextField()
                            }
                        )
                        Icon(
                            imageVector = Icons.Outlined.Tune,
                            contentDescription = "Filter",
                            tint = V8idColors.UI.IconTint,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Quick Action Buttons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Upload Button
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clickable { /* Upload */ },
                        shape = RoundedCornerShape(20.dp),
                        color = V8idColors.UI.Surface,
                        border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.CloudUpload,
                                contentDescription = null,
                                tint = V8idColors.UI.TextPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Upload",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = V8idColors.UI.TextPrimary
                            )
                        }
                    }
                    
                    // Folder Button (Selected/Highlighted)
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clickable { /* Folder */ },
                        shape = RoundedCornerShape(20.dp),
                        color = V8idColors.Purple.SubtlePurpleTint,
                        border = BorderStroke(1.dp, V8idColors.Purple.VibrantPurple.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Folder,
                                contentDescription = null,
                                tint = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Folder",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = V8idColors.Purple.VibrantPurple
                            )
                        }
                    }
                    
                    // Scan Button
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clickable { /* Scan */ },
                        shape = RoundedCornerShape(20.dp),
                        color = V8idColors.UI.Surface,
                        border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.QrCodeScanner,
                                contentDescription = null,
                                tint = V8idColors.UI.TextPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Scan",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = V8idColors.UI.TextPrimary
                            )
                        }
                    }
                }
            }

            // Files List Header - "Name ↑" with list icon
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                    color = V8idColors.UI.Surface,
                    shadowElevation = 1.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Name",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = V8idColors.UI.TextPrimary
                            )
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowUp,
                                contentDescription = "Sort ascending",
                                tint = V8idColors.UI.TextSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Icon(
                            imageVector = Icons.Outlined.Menu,
                            contentDescription = "View options",
                            tint = V8idColors.UI.TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Folders List
            items(folders) { folder ->
                FolderRowItem(
                    folder = folder,
                    onFolderClick = { /* Navigate to folder content */ },
                    onMoreClick = { /* Show options */ }
                )
            }
        }
    }
}
