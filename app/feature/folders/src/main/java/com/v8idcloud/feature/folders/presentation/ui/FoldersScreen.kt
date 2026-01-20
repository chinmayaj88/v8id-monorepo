package com.v8idcloud.feature.folders.presentation.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.ui.R
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.ui.components.FolderRowItem

@Composable
fun FoldersScreen(navController: NavHostController) {
    // Mock folders data - in a real app this would come from a ViewModel
    val folders = remember {
        listOf(
            FolderData(id = "1", name = "Documents", size = "12.5 GB", icon = Icons.Default.Description, iconColor = Color(0xFF4285F4)),
            FolderData(id = "2", name = "Photos", size = "8.2 GB", icon = Icons.Default.PhotoLibrary, iconColor = Color(0xFFEA4335)),
            FolderData(id = "3", name = "Videos", size = "15.3 GB", icon = Icons.Default.VideoLibrary, iconColor = Color(0xFFFBBC04)),
            FolderData(id = "4", name = "Music", size = "3.1 GB", icon = Icons.Default.LibraryMusic, iconColor = Color(0xFF34A853)),
            FolderData(id = "5", name = "Downloads", size = "1.8 GB", icon = Icons.Default.Download, iconColor = Color(0xFF673AB7)),
            FolderData(id = "6", name = "Archive", size = "2.4 GB", icon = Icons.Default.Archive, iconColor = Color(0xFF607D8B))
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        // Full Screen Background (bg2.jpg)
        Image(
            painter = painterResource(id = R.drawable.bg2),
            contentDescription = "Background",
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.fillMaxSize()
        )

        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(
                top = 16.dp + statusBarHeight,
                bottom = 16.dp
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Folders",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    IconButton(onClick = { /* Create folder */ }) {
                        Icon(
                            imageVector = Icons.Default.CreateNewFolder,
                            contentDescription = "New Folder",
                            tint = V8idColors.Purple.VibrantPurple
                        )
                    }
                }
            }

            // Folders List
            items(folders) { folder ->
                FolderRowItem(
                    folder = folder,
                    itemCount = (10..50).random(), // Mock item count
                    onFolderClick = { /* Navigate to folder content */ },
                    onMoreClick = { /* Show options */ }
                )
            }
        }
    }
}
