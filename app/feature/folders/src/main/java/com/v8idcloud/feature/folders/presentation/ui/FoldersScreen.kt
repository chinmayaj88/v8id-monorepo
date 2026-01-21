package com.v8idcloud.feature.folders.presentation.ui

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.ui.components.SearchBar
import com.v8idcloud.core.ui.components.FolderRowItem
import com.v8idcloud.feature.folders.presentation.viewmodel.FoldersViewModel
import com.v8idcloud.feature.folders.presentation.viewmodel.FoldersUiState

@Composable
fun FoldersScreen(
    navController: NavHostController,
    viewModel: FoldersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val folders by viewModel.folders.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()

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
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clickable { /* Upload */ },
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
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clickable { /* Options */ },
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

            // Reusable Search Bar from core:ui
            item {
                SearchBar(
                    hint = "Search folders",
                    searchQuery = searchQuery,
                    onQueryChange = { viewModel.onSearchQueryChange(it) },
                    searchResults = searchResults,
                    onFilterClick = { /* Show filter options */ },
                    onSuggestionClick = { suggestion ->
                        // Navigate to folder or file
                        viewModel.clearSearch()
                    }
                )
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

            // Content based on state
            when (val state = uiState) {
                is FoldersUiState.Loading -> {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                color = V8idColors.Purple.VibrantPurple
                            )
                        }
                    }
                }
                
                is FoldersUiState.Error -> {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.ErrorOutline,
                                contentDescription = null,
                                tint = V8idColors.UI.TextSecondary,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = state.message,
                                color = V8idColors.UI.TextSecondary
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.refresh() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = V8idColors.Purple.VibrantPurple
                                )
                            ) {
                                Text("Retry")
                            }
                        }
                    }
                }
                
                is FoldersUiState.Loaded -> {
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
                    if (folders.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(150.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Outlined.FolderOff,
                                        contentDescription = null,
                                        tint = V8idColors.UI.TextTertiary,
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No folders yet",
                                        color = V8idColors.UI.TextSecondary
                                    )
                                }
                            }
                        }
                    } else {
                        items(folders, key = { it.id }) { folder ->
                            FolderRowItem(
                                folder = folder,
                                onFolderClick = { /* Navigate to folder content */ },
                                onMoreClick = { /* Show options */ }
                            )
                        }
                    }
                }
            }
        }
    }
}
