package com.v8idcloud.feature.folders.presentation.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.ui.R

@Composable
fun FoldersScreen(navController: NavHostController) {
    // Mock folders data
    val folders = remember {
        listOf(
            FolderData("Documents", 45, Icons.Default.Description, "12.5 GB"),
            FolderData("Photos", 128, Icons.Default.PhotoLibrary, "8.2 GB"),
            FolderData("Videos", 23, Icons.Default.VideoLibrary, "15.3 GB"),
            FolderData("Music", 67, Icons.Default.LibraryMusic, "3.1 GB"),
            FolderData("Downloads", 12, Icons.Default.Download, "1.8 GB"),
            FolderData("Archive", 8, Icons.Default.Archive, "2.4 GB")
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        // Full Screen Background (bg2.jpg) - No blur, same as Home
        Image(
            painter = painterResource(id = R.drawable.bg2),
            contentDescription = "Background",
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.fillMaxSize()
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
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

            // Folders Grid
            items(folders) { folder ->
                FolderItemCard(folder = folder)
            }
        }
    }
}

@Composable
private fun FolderItemCard(folder: FolderData) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = V8idColors.UI.Surface,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Folder Icon
            Surface(
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(12.dp),
                color = V8idColors.UI.SearchBackground
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = folder.icon,
                        contentDescription = folder.name,
                        modifier = Modifier.size(28.dp),
                        tint = V8idColors.Purple.VibrantPurple
                    )
                }
            }

            // Folder Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = folder.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.UI.TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${folder.itemCount} items • ${folder.size}",
                    fontSize = 13.sp,
                    color = V8idColors.UI.TextSecondary
                )
            }

            // More Options
            IconButton(onClick = { /* More options */ }) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "More",
                    tint = V8idColors.UI.IconTint
                )
            }
        }
    }
}

data class FolderData(
    val name: String,
    val itemCount: Int,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val size: String
)
