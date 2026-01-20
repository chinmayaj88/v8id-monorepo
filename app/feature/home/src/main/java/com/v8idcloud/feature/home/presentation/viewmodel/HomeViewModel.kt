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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.Color

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authApiService: AuthApiService,
    private val fileApiService: FileApiService,
    private val storageManager: StorageManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _searchResults = MutableStateFlow<List<SearchSuggestion>>(emptyList())
    val searchResults: StateFlow<List<SearchSuggestion>> = _searchResults.asStateFlow()
    
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

    /**
     * Load dashboard data (storage, recent files, folders)
     */
    fun loadDashboardData() {
        viewModelScope.launch {
            try {
                // Keep the current loaded state if we are just refreshing
                if (_uiState.value !is HomeUiState.Loaded) {
                    _uiState.value = HomeUiState.Loading
                }
                
                val response = fileApiService.getDashboardData()
                val data = response.data
                
                val recentFiles = data.recentFiles.map { item ->
                    FileItem(
                        id = item.id,
                        name = item.name,
                        size = formatFileSize(item.size ?: 0),
                        timeAgo = "Recently", 
                        icon = getFileIcon(item.mimeType ?: ""),
                        thumbnailUrl = item.thumbnailUrl
                    )
                }
                
                val folders = data.folders.map { folder ->
                    FolderData(
                        id = folder.id,
                        name = folder.name,
                        size = "", 
                        icon = Icons.Outlined.Folder,
                        iconColor = parseColor(folder.color)
                    )
                }
                
                _uiState.value = HomeUiState.Loaded(
                    storageUsedPercentage = data.storage.percentage.toFloat(),
                    storageUsedText = "${String.format("%.1f", data.storage.used / (1024.0 * 1024.0 * 1024.0))} GB used",
                    recentFiles = recentFiles,
                    folders = folders,
                    totalFiles = data.stats.totalFiles,
                    totalFolders = data.stats.totalFolders
                )
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Failed to load dashboard")
            }
        }
    }

    private fun parseColor(colorString: String?): Color {
        return try {
            if (colorString != null && colorString.startsWith("#")) {
                Color(android.graphics.Color.parseColor(colorString))
            } else {
                Color(0xFF6B4EE6) // Default V8id purple
            }
        } catch (e: Exception) {
            Color(0xFF6B4EE6)
        }
    }

    private fun getFileIcon(mimeType: String): androidx.compose.ui.graphics.vector.ImageVector {
        return when {
            mimeType.startsWith("image/") -> Icons.Default.Image
            mimeType.startsWith("video/") -> Icons.Default.VideoFile
            mimeType.contains("pdf") -> Icons.Default.Description
            else -> Icons.Default.InsertDriveFile
        }
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
                        subtitle = if (item.type == "folder") "Folder" else formatFileSize(item.size ?: 0),
                        type = if (item.type == "folder") SuggestionType.FOLDER else SuggestionType.FILE
                    )
                }

                _searchResults.value = suggestions
            } catch (e: Exception) {
                _searchResults.value = emptyList()
            }
        }
    }

    private fun formatFileSize(size: Long): String {
        val kb = size / 1024.0
        val mb = kb / 1024.0
        val gb = mb / 1024.0
        
        return when {
            gb >= 1 -> String.format("%.1f GB", gb)
            mb >= 1 -> String.format("%.1f MB", mb)
            kb >= 1 -> String.format("%.1f KB", kb)
            else -> "$size B"
        }
    }

    /**
     * File Actions
     */
    fun downloadFile(fileId: String) {
        // Implementation for downloading
    }

    fun deleteFile(fileId: String) {
        // Implementation for deleting
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

data class SearchSuggestion(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: SuggestionType
)

enum class SuggestionType {
    FILE, FOLDER
}

data class FileItem(
    val id: String,
    val name: String,
    val size: String,
    val timeAgo: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val thumbnailUrl: String? = null
)

data class FolderData(
    val id: String,
    val name: String,
    val size: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconColor: Color
)
