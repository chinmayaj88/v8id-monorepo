package com.v8idcloud.feature.home.presentation.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel
import com.v8idcloud.core.common.SearchSuggestion
import com.v8idcloud.core.common.SuggestionType
import com.v8idcloud.feature.home.presentation.viewmodel.HomeUiState
import com.v8idcloud.core.ui.components.*

@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp
    val screenWidth = configuration.screenWidthDp

    // Dynamic Spacing and Size Calculations
    val dynamicVerticalSpacing = (screenHeight / 50).dp.coerceIn(12.dp, 24.dp)
    val dynamicPadding = (screenWidth / 15).dp.coerceIn(16.dp, 32.dp)
    val dynamicIconSize = (screenWidth / 8.5).dp.coerceIn(40.dp, 52.dp)
    val dynamicFolderIconSize = (screenWidth / 7).dp.coerceIn(48.dp, 60.dp)

    val uiState by viewModel.uiState.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()

    val userAvatarUrl by viewModel.userAvatarUrl.collectAsState()

    // State for filter menu visibility
    var showFilters by remember { mutableStateOf(false) }
    var searchQuery by rememberSaveable { mutableStateOf("") }

    // State for tracking which file card is currently swiped/revealed
    var revealedFileId by remember { mutableStateOf<String?>(null) }

    // Refresh data when screen becomes visible (including from background)
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                viewModel.loadDashboardData()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    val context = androidx.compose.ui.platform.LocalContext.current
    val downloadEvent by viewModel.downloadEvent.collectAsState()
    val shareEvent by viewModel.shareEvent.collectAsState()

    // State for Download Progress
    var currentDownloadId by remember { mutableStateOf<Long?>(null) }
    var downloadProgress by remember { mutableStateOf(0f) }
    var isDownloadComplete by remember { mutableStateOf(false) }

    // Handle Download Event and Start Download
    LaunchedEffect(downloadEvent) {
        downloadEvent?.let { event ->
            val id = com.v8idcloud.core.ui.utils.UiUtils.downloadFile(
                context = context,
                url = event.url,
                fileName = event.fileName,
                authToken = event.authToken
            )

            if (id != -1L) {
                currentDownloadId = id
                isDownloadComplete = false
                downloadProgress = 0f
            } else {
                android.widget.Toast.makeText(context, "Failed to start download", android.widget.Toast.LENGTH_SHORT).show()
            }
            viewModel.clearDownloadEvent()
        }
    }

    // Poll Download Progress
    LaunchedEffect(currentDownloadId) {
        if (currentDownloadId != null) {
            while (!isDownloadComplete) {
                val (bytesDownloaded, totalBytes) = com.v8idcloud.core.ui.utils.UiUtils.getDownloadProgress(context, currentDownloadId!!)

                if (totalBytes > 0) {
                    downloadProgress = bytesDownloaded.toFloat() / totalBytes.toFloat()
                }

                if (bytesDownloaded > 0 && bytesDownloaded >= totalBytes) {
                    isDownloadComplete = true
                    downloadProgress = 1f
                }

                kotlinx.coroutines.delay(500) // Poll every 500ms
            }
        }
    }

    // Handle Share Event
    LaunchedEffect(shareEvent) {
        shareEvent?.let { event ->
            val sendIntent = android.content.Intent().apply {
                action = android.content.Intent.ACTION_SEND
                putExtra(android.content.Intent.EXTRA_TEXT, "Check out this file from V8id Cloud: ${event.url}")
                type = "text/plain"
            }
            val shareIntent = android.content.Intent.createChooser(sendIntent, null)
            context.startActivity(shareIntent)
            viewModel.clearShareEvent()
        }
    }

    // Show Progress Dialog
    if (currentDownloadId != null) {
        com.v8idcloud.core.ui.components.DownloadProgressDialog(
            fileName = "Downloading file...",
            progress = downloadProgress,
            isComplete = isDownloadComplete,
            onDismiss = { currentDownloadId = null }
        )
    }

    // Compute user name
    val userEmail = userEmailFlow ?: ""
    val firstName = userFirstNameFlow ?: ""
    val userName = remember(userFirstNameFlow, userLastNameFlow, userEmail) {
        buildString {
            if (!userFirstNameFlow.isNullOrBlank()) append(userFirstNameFlow)
            if (!userLastNameFlow.isNullOrBlank()) {
                if (isNotEmpty()) append(" ")
                append(userLastNameFlow)
            }
        }.takeIf { it.isNotBlank() } ?: userEmail
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
                .padding(horizontal = dynamicPadding),
            contentPadding = PaddingValues(
                top = dynamicVerticalSpacing + statusBarHeight,
                bottom = 96.dp
            ),
            verticalArrangement = Arrangement.spacedBy(dynamicVerticalSpacing)
        ) {
            // Header with Profile and Notification
            item {
                ProfileHeader(
                    userName = firstName.takeIf { it.isNotBlank() } ?: userName,
                    storagePercentage = if (uiState is HomeUiState.Loaded) (uiState as HomeUiState.Loaded).storageUsedPercentage else 0f,
                    profileImageUrl = userAvatarUrl,
                    onLogout = { viewModel.logout(onLogoutSuccess = { navController.navigate("auth/login") { popUpTo(0) } }) },
                    onProfileClick = { navController.navigate("user") }
                )
            }

            // Main Heading
            item {
                GradientHeading(screenWidth = screenWidth)
            }

            // Search Bar
            item {
                SearchBar(
                    searchQuery = searchQuery,
                    onQueryChange = {
                        searchQuery = it
                        viewModel.search(it)
                    },
                    searchResults = searchResults,
                    onSuggestionClick = { suggestion ->
                        if (suggestion.type == SuggestionType.FOLDER) {
                            navController.navigate("folders?folderId=${suggestion.id}")
                        }
                    },
                    onFilterClick = { showFilters = !showFilters }
                )
            }

            // Filter Chips Row
            item {
                AnimatedVisibility(visible = showFilters) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("All", "Images", "Videos", "Docs").forEach { filter ->
                            FilterChip(
                                selected = selectedFilter == filter,
                                onClick = { viewModel.setFilter(filter) },
                                label = { Text(filter) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = V8idColors.Purple.VibrantPurple.copy(alpha = 0.1f),
                                    selectedLabelColor = V8idColors.Purple.VibrantPurple
                                )
                            )
                        }
                    }
                }
            }

            if (uiState is HomeUiState.Loaded) {
                val state = uiState as HomeUiState.Loaded

                // Quick Access Card
                item {
                    QuickAccessCard(
                        onOptionClick = { option ->
                            when(option) {
                                "Images" -> viewModel.setFilter("Images") // Or navigate
                                "Videos" -> viewModel.setFilter("Videos")
                                "Docs" -> viewModel.setFilter("Docs")
                                "Folders" -> navController.navigate("folders")
                            }
                        }
                    )
                }

                // File Count Chip - Centered
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        FileSummaryChip(fileCount = state.totalFiles, folderCount = state.totalFolders)
                    }
                }

                // Viewed Links Promotional Card
                item {
                    ViewedLinksCard(
                        onSeeAllClick = { /* Handle see all click */ }
                    )
                }

                // Recent Files Section
                item {
                    Text(
                        text = "Recent Files",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                }

                items(state.recentFiles, key = { it.id }) { file ->
                    FileItemCard(
                        file = file,
                        iconSize = dynamicIconSize,
                        isRevealed = revealedFileId == file.id,
                        onExpand = { revealedFileId = file.id },
                        onCollapse = { if (revealedFileId == file.id) revealedFileId = null },
                        onDownload = {
                            viewModel.downloadFile(file.id)
                        },
                        onDelete = { viewModel.deleteFile(file.id) },
                        onShare = { viewModel.shareFile(file.id) },
                        onClick = {
                            navController.navigate("viewer?fileId=${file.id}&fileName=${file.name}&fileType=${file.mimeType ?: "*/*"}")
                        }
                    )
                }
            } else if (uiState is HomeUiState.Loading) {
                item {
                   Box(modifier = Modifier.fillParentMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                       CircularProgressIndicator(color = V8idColors.Purple.VibrantPurple)
                   }
                }
            } else if (uiState is HomeUiState.Error) {
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = V8idColors.Semantic.Error, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(16.dp))
                        Text((uiState as HomeUiState.Error).message, color = V8idColors.UI.TextSecondary, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.loadDashboardData() },
                            colors = ButtonDefaults.buttonColors(containerColor = V8idColors.Purple.VibrantPurple)
                        ) {
                            Text("Retry")
                        }
                    }
                }
            }
        }
    }
}
