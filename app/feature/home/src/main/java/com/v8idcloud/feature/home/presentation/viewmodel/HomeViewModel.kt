package com.v8idcloud.feature.home.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.data.network.AuthApiService
import com.v8idcloud.core.data.network.LogoutRequest
import com.v8idcloud.core.data.storage.StorageManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import javax.inject.Inject
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.common.FileItem
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.common.SearchSuggestion
import com.v8idcloud.core.common.SuggestionType
import com.v8idcloud.core.data.network.DashboardResponseDto
import com.v8idcloud.core.common.formatFileSize
import com.v8idcloud.core.common.formatTimeAgo
import com.v8idcloud.core.ui.utils.UiUtils
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Folder

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authApiService: AuthApiService,
    private val fileApiService: FileApiService,
    private val storageManager: StorageManager,
    private val configProvider: com.v8idcloud.core.common.ConfigProvider
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _searchResults = MutableStateFlow<List<SearchSuggestion>>(emptyList())
    val searchResults: StateFlow<List<SearchSuggestion>> = _searchResults.asStateFlow()

    private val _selectedFilter = MutableStateFlow("All")
    val selectedFilter: StateFlow<String> = _selectedFilter.asStateFlow()

    private val _downloadEvent = MutableStateFlow<DownloadEvent?>(null)
    val downloadEvent: StateFlow<DownloadEvent?> = _downloadEvent.asStateFlow()

    private val _shareEvent = MutableStateFlow<ShareEvent?>(null)
    val shareEvent: StateFlow<ShareEvent?> = _shareEvent.asStateFlow()

    fun clearDownloadEvent() { _downloadEvent.value = null }
    fun clearShareEvent() { _shareEvent.value = null }

    private val _dashboardData = MutableStateFlow<DashboardResponseDto?>(null)
    
    // User info flows
    val userEmail: StateFlow<String?> = storageManager.getUserEmail().stateIn(
        scope = viewModelScope,
        started = kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    val userFirstName: StateFlow<String?> = storageManager.getUserFirstName().stateIn(
        scope = viewModelScope,
        started = kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    val userLastName: StateFlow<String?> = storageManager.getUserLastName().stateIn(
        scope = viewModelScope,
        started = kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )
    
    init {
        loadDashboardData()
    }

    fun setFilter(filter: String) {
        _selectedFilter.value = filter
        updateUiState()
    }

    /**
     * Load dashboard data (storage, recent files, folders)
     */
    fun loadDashboardData() {
        viewModelScope.launch {
            try {
                if (_uiState.value !is HomeUiState.Loaded) {
                    _uiState.value = HomeUiState.Loading
                }
                
                val response = fileApiService.getDashboardData()
                val data = response.data
                _dashboardData.value = data
                
                updateUiState()
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Failed to load dashboard")
            }
        }
    }

    private fun updateUiState() {
        val data = _dashboardData.value ?: return
        val filter = _selectedFilter.value

        val filteredRecentFiles = data.recentFiles.filter { item ->
            when (filter) {
                "Images" -> item.mimeType?.startsWith("image/") == true
                "Videos" -> item.mimeType?.startsWith("video/") == true
                "Docs" -> item.mimeType?.contains("pdf") == true || item.mimeType?.contains("word") == true
                else -> true
            }
        }.map { item ->
            FileItem(
                id = item.id,
                name = item.name,
                size = (item.size ?: 0L).formatFileSize(),
                timeAgo = item.updatedAt.formatTimeAgo(),
                icon = UiUtils.getFileIcon(item.mimeType),
                thumbnailUrl = item.thumbnailUrl,
                mimeType = item.mimeType
            )
        }

        val folders = data.folders.map { folder ->
            FolderData(
                id = folder.id,
                name = folder.name,
                size = "",
                icon = Icons.Outlined.Folder,
                iconColor = UiUtils.parseColor(folder.color)
            )
        }

        _uiState.value = HomeUiState.Loaded(
            storageUsedPercentage = data.storage.percentage.toFloat(),
            storageUsedText = "${String.format("%.1f", data.storage.used / (1024.0 * 1024.0 * 1024.0))} GB used",
            recentFiles = filteredRecentFiles,
            folders = folders,
            totalFiles = data.stats.totalFiles,
            totalFolders = data.stats.totalFolders
        )
    }


    /**
     * Search files and folders
     */
    fun search(query: String) {
        if (query.isBlank()) {
            _searchResults.value = emptyList()
            return
        }

        viewModelScope.launch {
            try {
                val response = fileApiService.unifiedSearch(query = query, limit = 8)
                val results = response.data.results

                val suggestions = results.map { item ->
                    SearchSuggestion(
                        id = item.id,
                        title = item.name,
                        subtitle = if (item.type == "folder") "Folder" else (item.size ?: 0L).formatFileSize(),
                        type = if (item.type == "folder") SuggestionType.FOLDER else SuggestionType.FILE
                    )
                }

                _searchResults.value = suggestions
            } catch (e: Exception) {
                _searchResults.value = emptyList()
            }
        }
    }

    /**
     * File Actions
     */
    fun downloadFile(fileId: String) {
        viewModelScope.launch {
            try {
                _uiState.value.let { state ->
                    if (state is HomeUiState.Loaded) {
                        val fileItem = state.recentFiles.find { it.id == fileId }
                        val response = fileApiService.generateLink(fileId)
                        val linkData = response.data
                        
                        // Construct full URL and fix localhost for emulator
                        var constructedUrl = if (linkData.linkUrl.startsWith("http")) {
                            linkData.linkUrl
                        } else {
                            "${configProvider.baseUrl.trimEnd('/')}${linkData.linkUrl}"
                        }
                        
                        // Fix URL host if backend returns localhost
                        // This handles both Emulator (10.0.2.2) and Physical Device (192.168.x.x)
                        // provided configProvider.baseUrl is set correctly in local.properties
                        try {
                            val baseUrlHost = java.net.URI(configProvider.baseUrl).host
                            android.util.Log.d("HomeViewModel", "Base URL Host: $baseUrlHost")
                            
                            if (baseUrlHost != null && "localhost" !in baseUrlHost && "127.0.0.1" !in baseUrlHost) {
                                constructedUrl = constructedUrl
                                    .replace("localhost", baseUrlHost)
                                    .replace("127.0.0.1", baseUrlHost)
                            } else if (android.os.Build.FINGERPRINT.contains("generic")) {
                                // Fallback for emulator if baseUrl is still localhost
                                constructedUrl = constructedUrl
                                    .replace("localhost", "10.0.2.2")
                                    .replace("127.0.0.1", "10.0.2.2")
                            }
                        } catch (e: Exception) {
                            // If URI parsing fails, ignore and use original
                            android.util.Log.e("HomeViewModel", "Error parsing base URL", e)
                        }
                        
                        val fullUrl = constructedUrl
                        android.util.Log.d("HomeViewModel", "Download Request: URL=$fullUrl")

                        // Get auth token for download request
                        val authToken = storageManager.getAccessTokenSync()
                        android.util.Log.d("HomeViewModel", "Auth Token present: ${authToken != null}")

                        // We will need a way to trigger the actual download from the UI
                        // For now, let's use a side effect or a simple Event
                        _downloadEvent.value = DownloadEvent(
                            url = fullUrl,
                            fileName = fileItem?.name ?: "downloaded_file",
                            mimeType = fileItem?.mimeType,
                            authToken = authToken
                        )
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Download error", e)
            }
        }
    }

    fun deleteFile(fileId: String) {
        viewModelScope.launch {
            try {
                fileApiService.deleteFile(fileId)
                // Refresh dashboard after deletion
                loadDashboardData()
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Delete error", e)
            }
        }
    }

    fun shareFile(fileId: String) {
        viewModelScope.launch {
            try {
                val response = fileApiService.generateLink(fileId)
                val linkData = response.data
                
                val fullUrl = if (linkData.linkUrl.startsWith("http")) {
                    linkData.linkUrl
                } else {
                    "${configProvider.baseUrl.trimEnd('/')}${linkData.linkUrl}"
                }

                _shareEvent.value = ShareEvent(url = fullUrl)
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Share error", e)
            }
        }
    }

    /**
     * Logout function
     */
    fun logout(onLogoutSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = HomeUiState.LoggingOut
            
            try {
                val accessToken = storageManager.getAccessTokenSync()
                val sessionId = storageManager.getSessionIdSync()
                
                if (accessToken != null && sessionId != null) {
                    runCatching {
                        authApiService.logout(
                            token = "Bearer $accessToken",
                            request = LogoutRequest(sessionId = sessionId)
                        )
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("HomeViewModel", "Logout error", e)
            } finally {
                storageManager.clearAuthData()
                _uiState.value = HomeUiState.LoggedOut
                onLogoutSuccess()
            }
        }
    }
}

/**
 * Home UI State
 */
sealed interface HomeUiState {
    object Loading : HomeUiState
    data class Loaded(
        val storageUsedPercentage: Float,
        val storageUsedText: String,
        val recentFiles: List<FileItem>,
        val folders: List<FolderData>,
        val totalFiles: Int,
        val totalFolders: Int
    ) : HomeUiState
    object LoggingOut : HomeUiState
    object LoggedOut : HomeUiState
    data class Error(val message: String) : HomeUiState
}

data class DownloadEvent(val url: String, val fileName: String, val mimeType: String? = null, val authToken: String? = null)
data class ShareEvent(val url: String)




