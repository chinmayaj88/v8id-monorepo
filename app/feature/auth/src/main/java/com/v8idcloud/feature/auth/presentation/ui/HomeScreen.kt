package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeViewModel
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeUiState
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()

    // Compute user name
    val userEmail = userEmailFlow ?: ""
    val userName = remember(userFirstNameFlow, userLastNameFlow, userEmail) {
        buildString {
            if (!userFirstNameFlow.isNullOrBlank()) append(userFirstNameFlow)
            if (!userLastNameFlow.isNullOrBlank()) {
                if (isNotEmpty()) append(" ")
                append(userLastNameFlow)
            }
        }.takeIf { it.isNotBlank() } ?: userEmail
    }

    // Mock data for cloud storage
    val storageUsed = 12.5f // GB
    val storageTotal = 50f // GB
    val storagePercentage = (storageUsed / storageTotal) * 100f

    val recentFiles = remember {
        listOf(
            FileItem("Document.pdf", "2.5 MB", "2 hours ago", Icons.Default.Description),
            FileItem("Photo.jpg", "5.1 MB", "1 day ago", Icons.Default.Image),
            FileItem("Spreadsheet.xlsx", "1.2 MB", "3 days ago", Icons.Default.TableChart),
            FileItem("Video.mp4", "250 MB", "1 week ago", Icons.Default.VideoFile)
        )
    }

    val folders = remember {
        listOf(
            FolderItem("Documents", 15, Icons.Default.Folder),
            FolderItem("Photos", 42, Icons.Default.PhotoLibrary),
            FolderItem("Videos", 8, Icons.Default.VideoLibrary),
            FolderItem("Music", 23, Icons.Default.LibraryMusic)
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Background Image
        Image(
            painter = painterResource(id = R.drawable.bg1),
            contentDescription = "Background",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.1f)
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header Section
            item {
                HomeHeader(userName = userName, userEmail = userEmail)
            }

            // Storage Usage Card
            item {
                StorageUsageCard(
                    used = storageUsed,
                    total = storageTotal,
                    percentage = storagePercentage
                )
            }

            // Quick Access Folders
            item {
                Text(
                    text = "Quick Access",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.Purple.DarkNavy,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }

            item {
                FoldersGrid(folders = folders)
            }

            // Recent Files
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Files",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.Purple.DarkNavy
                    )
                    TextButton(onClick = { /* Navigate to all files */ }) {
                        Text(
                            text = "View All",
                            color = V8idColors.Purple.VibrantPurple,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            items(recentFiles) { file ->
                FileItemCard(file = file)
            }
        }
    }
}

@Composable
private fun HomeHeader(userName: String, userEmail: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Welcome back,",
                fontSize = 16.sp,
                color = V8idColors.Purple.Indigo
            )
            Text(
                text = userName,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )
        }

        // Profile Avatar
        Surface(
            modifier = Modifier.size(56.dp),
            shape = CircleShape,
            color = V8idColors.Purple.VibrantPurpleAlt,
            shadowElevation = 8.dp
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Text(
                    text = userName.take(1).uppercase(),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.White
                )
            }
        }
    }
}

@Composable
private fun StorageUsageCard(used: Float, total: Float, percentage: Float) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.Purple.SubtlePurpleTint,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Storage",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = V8idColors.Purple.DarkNavy
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${String.format("%.1f", used)} GB / ${String.format("%.0f", total)} GB",
                        fontSize = 14.sp,
                        color = V8idColors.Purple.Indigo
                    )
                }
                Text(
                    text = "${String.format("%.0f", percentage)}%",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.Purple.VibrantPurple
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress Bar
            LinearProgressIndicator(
                progress = { percentage / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = V8idColors.Purple.VibrantPurple,
                trackColor = V8idColors.Purple.VeryLightPurple
            )
        }
    }
}

@Composable
private fun FoldersGrid(folders: List<FolderItem>) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        folders.chunked(2).forEach { rowFolders ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                rowFolders.forEach { folder ->
                    FolderCard(
                        folder = folder,
                        modifier = Modifier.weight(1f)
                    )
                }
                // Add empty space if odd number
                if (rowFolders.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun FolderCard(folder: FolderItem, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = folder.icon,
                contentDescription = folder.name,
                modifier = Modifier.size(40.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = folder.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = V8idColors.Purple.DarkNavy
            )
            Text(
                text = "${folder.itemCount} items",
                fontSize = 12.sp,
                color = V8idColors.Purple.Indigo
            )
        }
    }
}

@Composable
private fun FileItemCard(file: FileItem) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = file.icon,
                contentDescription = file.name,
                modifier = Modifier.size(40.dp),
                tint = V8idColors.Purple.VibrantPurpleAlt
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = file.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.Purple.DarkNavy
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${file.size} • ${file.timeAgo}",
                    fontSize = 12.sp,
                    color = V8idColors.Purple.Indigo
                )
            }
            IconButton(onClick = { /* More options */ }) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "More",
                    tint = V8idColors.Purple.Indigo
                )
            }
        }
    }
}

data class FileItem(
    val name: String,
    val size: String,
    val timeAgo: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

data class FolderItem(
    val name: String,
    val itemCount: Int,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)
