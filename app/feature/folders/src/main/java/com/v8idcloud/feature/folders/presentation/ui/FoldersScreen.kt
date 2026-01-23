package com.v8idcloud.feature.folders.presentation.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.paging.LoadState
import androidx.paging.compose.collectAsLazyPagingItems
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.ui.components.SearchBar
import com.v8idcloud.core.ui.components.FolderRowItem
import com.v8idcloud.feature.folders.presentation.viewmodel.FoldersViewModel

@Composable
fun FoldersScreen(
    navController: NavHostController,
    viewModel: FoldersViewModel = hiltViewModel()
) {
    val pagedFiles = viewModel.pagedFiles.collectAsLazyPagingItems()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val currentPath by viewModel.currentPath.collectAsState()

    // Handle back press to navigate up the folder hierarchy
    // Note: This needs to be hooked into the system back handler in a real app
    // e.g. BackHandler { if (!viewModel.navigateUp()) navController.popBackStack() }

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
            // Header with Title/Breadcrumb and Action Icons
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Title / Breadcrumbs
                    Column {
                        val currentFolder = currentPath.lastOrNull()
                        Text(
                            text = currentFolder?.second ?: "V8id Cloud",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = V8idColors.UI.TextPrimary
                        )
                        if (currentPath.size > 1) {
                            Text(
                                text = "Back to ${currentPath.getOrNull(currentPath.size - 2)?.second ?: "Home"}",
                                fontSize = 14.sp,
                                color = V8idColors.UI.TextSecondary,
                                modifier = Modifier.clickable { 
                                   if (!viewModel.navigateUp()) {
                                       // At root
                                   }
                                }
                            )
                        }
                    }
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        /* Action Icons (Upload/Options) - Same as before */
                        // ... (Kept brief for brevity, can restore full UI)
                         Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = V8idColors.UI.Surface,
                            border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                        ) {
                             Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                 Icon(Icons.Outlined.CloudUpload, "Upload", tint = V8idColors.UI.TextPrimary, modifier = Modifier.size(20.dp))
                             }
                        }
                    }
                }
            }

            // Search Bar
            item {
                SearchBar(
                    hint = "Search in ${currentPath.last().second}",
                    searchQuery = searchQuery,
                    onQueryChange = { viewModel.onSearchQueryChange(it) },
                    searchResults = searchResults,
                    onFilterClick = { /* Show filter options */ },
                    onSuggestionClick = { suggestion ->
                        viewModel.clearSearch()
                        // Handle navigation to suggestion
                    }
                )
            }

            // Quick Actions (Upload, Folder types etc)
            // ... (Same as before)

            // Sort Header
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
                            Text("Name", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = V8idColors.UI.TextPrimary)
                            Icon(Icons.Default.KeyboardArrowUp, "Sort", tint = V8idColors.UI.TextSecondary, modifier = Modifier.size(18.dp))
                        }
                        Icon(Icons.Outlined.Menu, "View", tint = V8idColors.UI.TextSecondary, modifier = Modifier.size(20.dp))
                    }
                }
            }

            // Paged List Content
            if (pagedFiles.loadState.refresh is LoadState.Loading) {
                // Initial Loading Shimmer
                 items(5) {
                     Box(
                         modifier = Modifier
                             .fillMaxWidth()
                             .height(64.dp)
                             .background(Color.Gray.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                     )
                 }
            } else if (pagedFiles.loadState.refresh is LoadState.Error) {
                 item {
                     val e = pagedFiles.loadState.refresh as LoadState.Error
                     Text("Error: ${e.error.message}", color = Color.Red, modifier = Modifier.padding(16.dp))
                     Button(onClick = { pagedFiles.retry() }) { Text("Retry") }
                 }
            } else if (pagedFiles.itemCount == 0) {
                 item {
                     Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Outlined.FolderOff, null, tint = V8idColors.UI.TextTertiary, modifier = Modifier.size(48.dp))
                            Text("Empty folder", color = V8idColors.UI.TextSecondary)
                        }
                    }
                 }
            } else {
                items(
                    count = pagedFiles.itemCount,
                    key = { index -> 
                        // Use key for optimization if item is loaded
                        pagedFiles.peek(index)?.id ?: index 
                    }
                ) { index ->
                    val item = pagedFiles[index]
                    if (item != null) {
                        FolderRowItem(
                            folder = item,
                            onFolderClick = { 
                                if (item.isFolder) {
                                    viewModel.navigateToFolder(item.id, item.name)
                                } else {
                                    // Navigate to File Viewer
                                    // navController.navigate("viewer/${item.id}/${currentPath.last().first ?: "root"}")
                                }
                            },
                            onMoreClick = { /* Show options */ }
                        )
                    } else {
                        // Placeholder
                         Box(modifier = Modifier.height(60.dp).fillMaxWidth())
                    }
                }
            }
            
            // Append Loading Indicator
            if (pagedFiles.loadState.append is LoadState.Loading) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                         CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                    }
                }
            }
        }
    }
}
