package com.v8idcloud.feature.folders.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.v8idcloud.core.data.network.SearchResultItemDto
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.folders.presentation.viewmodel.MediaUiState
import com.v8idcloud.feature.folders.presentation.viewmodel.MediaViewModel

@Composable
fun MediaScreen(
    navController: NavHostController,
    viewModel: MediaViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()

    val categories = listOf(
        "IMAGE" to "Images",
        "VIDEO" to "Videos",
        "DOCUMENT" to "Docs",
        "AUDIO" to "Audio"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 16.dp + statusBarHeight)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(44.dp),
                    shape = CircleShape,
                    color = V8idColors.UI.Surface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
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
                    text = "Media Gallery",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.UI.TextPrimary
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                categories.forEach { (catId, title) ->
                    val isSelected = selectedCategory == catId
                    val bgColor = if (isSelected) V8idColors.Purple.VibrantPurple else V8idColors.UI.Surface
                    val textColor = if (isSelected) Color.White else V8idColors.UI.TextSecondary
                    
                    Surface(
                        modifier = Modifier
                            .height(36.dp)
                            .clickable { viewModel.onCategorySelected(catId) },
                        shape = RoundedCornerShape(18.dp),
                        color = bgColor,
                        border = if (!isSelected) androidx.compose.foundation.BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f)) else null
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        ) {
                            Text(
                                text = title,
                                color = textColor,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Content
            Box(modifier = Modifier.weight(1f)) {
                when (uiState) {
                    is MediaUiState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = V8idColors.Purple.VibrantPurple)
                        }
                    }
                    is MediaUiState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                             Text(
                                text = (uiState as MediaUiState.Error).message,
                                color = V8idColors.Semantic.Error
                            )
                        }
                    }
                    is MediaUiState.Empty -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.ImageNotSupported,
                                    contentDescription = null,
                                    tint = V8idColors.UI.TextTertiary,
                                    modifier = Modifier.size(64.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "No files found",
                                    color = V8idColors.UI.TextSecondary
                                )
                            }
                        }
                    }
                    is MediaUiState.Success -> {
                        val files = (uiState as MediaUiState.Success).files
                        
                        val onFileClick: (SearchResultItemDto) -> Unit = { file ->
                            val encodedName = java.net.URLEncoder.encode(file.name, "UTF-8")
                            val encodedType = java.net.URLEncoder.encode(file.mimeType ?: viewModel.selectedCategory.value, "UTF-8")
                            navController.navigate("viewer?fileId=${file.id}&fileName=$encodedName&fileType=$encodedType")
                        }

                        if (selectedCategory == "DOCUMENT" || selectedCategory == "AUDIO") {
                            DocList(files, onFileClick)
                        } else {
                            MediaGrid(files, isVideo = selectedCategory == "VIDEO", onFileClick)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MediaGrid(
    files: List<SearchResultItemDto>, 
    isVideo: Boolean,
    onFileClick: (SearchResultItemDto) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 20.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(files) { file ->
            Surface(
                modifier = Modifier
                    .aspectRatio(1f)
                    .clickable { onFileClick(file) },
                shape = RoundedCornerShape(12.dp),
                color = V8idColors.UI.Surface,
                shadowElevation = 2.dp
            ) {
                Box {
                    if (file.thumbnailUrl != null) {
                         AsyncImage(
                            model = file.thumbnailUrl,
                            contentDescription = file.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier.fillMaxSize().background(V8idColors.Purple.SubtlePurpleTint),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isVideo) Icons.Default.Videocam else Icons.Default.Image,
                                contentDescription = null,
                                tint = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    
                    if (isVideo) {
                        Box(
                            modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                             Icon(
                                imageVector = Icons.Default.PlayCircle,
                                contentDescription = "Play",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DocList(
    files: List<SearchResultItemDto>,
    onFileClick: (SearchResultItemDto) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(files) { file ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onFileClick(file) },
                shape = RoundedCornerShape(16.dp),
                color = V8idColors.UI.Surface,
                shadowElevation = 1.dp,
                 border = androidx.compose.foundation.BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.1f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFFC107).copy(alpha = 0.1f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Description,
                                contentDescription = null,
                                tint = Color(0xFFFFC107),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = file.name,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp,
                            color = V8idColors.UI.TextPrimary,
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${formatSize(file.size ?: 0)} • ${file.updatedAt.take(10)}",
                            fontSize = 12.sp,
                            color = V8idColors.UI.TextSecondary
                        )
                    }
                }
            }
        }
    }
}

// Helper to avoid duplicate code (should be in utils)
private fun formatSize(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val units = arrayOf("B", "KB", "MB", "GB", "TB")
    val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
    return "%.1f %s".format(
        bytes / Math.pow(1024.0, digitGroups.toDouble()),
        units[digitGroups]
    )
}
