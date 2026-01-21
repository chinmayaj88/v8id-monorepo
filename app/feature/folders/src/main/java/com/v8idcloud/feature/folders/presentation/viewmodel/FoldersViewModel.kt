package com.v8idcloud.feature.folders.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.common.SearchSuggestion
import com.v8idcloud.core.common.SuggestionType
import com.v8idcloud.core.ui.utils.UiUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.ui.graphics.Color

@HiltViewModel
class FoldersViewModel @Inject constructor(
    private val fileApiService: FileApiService
) : ViewModel() {

    companion object {
        private const val TAG = "FoldersViewModel"
    }

    // UI State
    private val _uiState = MutableStateFlow<FoldersUiState>(FoldersUiState.Loading)
    val uiState: StateFlow<FoldersUiState> = _uiState.asStateFlow()

    // Search
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<SearchSuggestion>>(emptyList())
    val searchResults: StateFlow<List<SearchSuggestion>> = _searchResults.asStateFlow()

    // Folders list
    private val _folders = MutableStateFlow<List<FolderData>>(emptyList())
    val folders: StateFlow<List<FolderData>> = _folders.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadFolders()
    }

    /**
     * Load folders from the dashboard API
     */
    fun loadFolders() {
        viewModelScope.launch {
            try {
                _uiState.value = FoldersUiState.Loading
                
                val response = fileApiService.getDashboardData()
                val data = response.data
                
                // Map folder DTOs to FolderData with appropriate icons and colors
                val folderList = data.folders.map { dto ->
                    val (icon, color) = getFolderIconAndColor(dto.name)
                    FolderData(
                        id = dto.id,
                        name = dto.name,
                        size = "", // Size not available from folder DTO
                        icon = icon,
                        iconColor = UiUtils.parseColor(dto.color, color)
                    )
                }
                
                _folders.value = folderList
                _uiState.value = FoldersUiState.Loaded(folderList)
                
            } catch (e: Exception) {
                android.util.Log.e(TAG, "Failed to load folders", e)
                _uiState.value = FoldersUiState.Error(e.message ?: "Failed to load folders")
            }
        }
    }

    /**
     * Search folders and files
     */
    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        
        // Cancel previous search job
        searchJob?.cancel()
        
        if (query.isEmpty()) {
            _searchResults.value = emptyList()
            return
        }
        
        // Debounce search - wait 300ms before searching
        searchJob = viewModelScope.launch {
            delay(300)
            performSearch(query)
        }
    }

    private suspend fun performSearch(query: String) {
        try {
            val response = fileApiService.unifiedSearch(query)
            
            _searchResults.value = response.data.results.map { item ->
                SearchSuggestion(
                    id = item.id,
                    title = item.name,
                    subtitle = when (item.type) {
                        "folder" -> "Folder"
                        else -> item.mimeType ?: "File"
                    },
                    type = if (item.type == "folder") SuggestionType.FOLDER else SuggestionType.FILE,
                    icon = if (item.type == "folder") {
                        Icons.Outlined.Folder
                    } else {
                        UiUtils.getFileIcon(item.mimeType)
                    }
                )
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Search failed", e)
            _searchResults.value = emptyList()
        }
    }

    /**
     * Clear search
     */
    fun clearSearch() {
        _searchQuery.value = ""
        _searchResults.value = emptyList()
    }

    /**
     * Refresh folders
     */
    fun refresh() {
        loadFolders()
    }

    /**
     * Get appropriate icon and color for folder name
     */
    private fun getFolderIconAndColor(name: String): Pair<androidx.compose.ui.graphics.vector.ImageVector, Color> {
        val lowerName = name.lowercase()
        return when {
            lowerName.contains("document") -> Icons.Default.Description to Color(0xFFFFC107) // Yellow/Amber
            lowerName.contains("photo") || lowerName.contains("image") -> Icons.Default.PhotoLibrary to Color(0xFF4CAF50) // Green
            lowerName.contains("video") -> Icons.Default.VideoLibrary to Color(0xFFE91E63) // Pink
            lowerName.contains("music") || lowerName.contains("audio") -> Icons.Default.LibraryMusic to Color(0xFF9C27B0) // Purple
            lowerName.contains("download") -> Icons.Default.Download to Color(0xFFE91E63) // Pink
            lowerName.contains("archive") -> Icons.Default.Archive to Color(0xFFFFC107) // Yellow
            lowerName.contains("presentation") || lowerName.contains("slide") -> Icons.Default.Slideshow to Color(0xFF4CAF50) // Green
            lowerName.contains("client") -> Icons.Default.Folder to Color(0xFF2196F3) // Blue
            lowerName.contains("app") -> Icons.Default.Apps to Color(0xFF4CAF50) // Green
            else -> Icons.Default.Folder to Color(0xFF7C3AED) // Purple (default)
        }
    }
}

/**
 * Folders screen UI state
 */
sealed class FoldersUiState {
    data object Loading : FoldersUiState()
    data class Loaded(val folders: List<FolderData>) : FoldersUiState()
    data class Error(val message: String) : FoldersUiState()
}
