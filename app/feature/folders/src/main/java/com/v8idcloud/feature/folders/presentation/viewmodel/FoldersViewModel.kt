package com.v8idcloud.feature.folders.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.PagingData
import androidx.paging.cachedIn
import androidx.paging.map
import com.v8idcloud.core.common.FolderData
import com.v8idcloud.core.common.SearchSuggestion
import com.v8idcloud.core.common.SuggestionType
import com.v8idcloud.core.data.local.entity.FileEntity
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.repository.FileRepository
import com.v8idcloud.core.ui.utils.UiUtils
import com.v8idcloud.core.ui.theme.V8idColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.coroutines.ExperimentalCoroutinesApi

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class FoldersViewModel @Inject constructor(
    private val fileRepository: FileRepository,
    private val fileApiService: FileApiService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    companion object {
        private const val TAG = "FoldersViewModel"
    }

    // Extract folderId and folderName from navigation arguments
    private val navFolderId: String? = savedStateHandle["folderId"]
    private val navFolderName: String? = savedStateHandle["folderName"]

    // Current Folder Context (Path for Breadcrumbs)
    private val _currentPath = MutableStateFlow<List<Pair<String?, String>>>(listOf(null to "Home"))
    val currentPath: StateFlow<List<Pair<String?, String>>> = _currentPath.asStateFlow()

    // The active Paging Flow
    private val _currentFolderId = MutableStateFlow<String?>(navFolderId)

    init {
        // Initial path setup
        if (navFolderId != null) {
            updatePathForFolder(navFolderId)
        }
    }
    
    val pagedFiles: Flow<PagingData<FolderData>> = _currentFolderId
        .flatMapLatest { folderId -> 
           // Use flatMapLatest to cancel previous stream and start a new one
           fileRepository.getFilesStream(folderId)
        }
        .map { pagingData ->
            pagingData.map { entity -> mapEntityToUiModel(entity) }
        }
        .cachedIn(viewModelScope) // Cache in ViewModel scope

    // Search
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<SearchSuggestion>>(emptyList())
    val searchResults: StateFlow<List<SearchSuggestion>> = _searchResults.asStateFlow()

    private var searchJob: Job? = null

    /**
     * Navigate to a folder
     */
    fun navigateToFolder(id: String, name: String) {
        _currentFolderId.value = id
        updatePathForFolder(id)
    }

    /**
     * Navigate back
     * Returns true if handled, false if at root
     */
    fun navigateUp(): Boolean {
        val current = _currentPath.value
        if (current.size > 1) {
            val parentFolder = current.getOrNull(current.size - 2)
            val parentId = parentFolder?.first
            _currentFolderId.value = parentId
            updatePathForFolder(parentId)
            return true
        }
        return false
    }

    /**
     * Jumps to a specific folder in the breadcrumb path
     */
    fun navigateToPathIndex(index: Int) {
        val target = _currentPath.value.getOrNull(index)
        val id = target?.first
        _currentFolderId.value = id
        updatePathForFolder(id)
    }

    private fun updatePathForFolder(id: String?) {
        if (id == null) {
            _currentPath.value = listOf(null to "Home")
            return
        }

        viewModelScope.launch {
            try {
                val response = fileApiService.getFolderPath(id)
                if (response.success) {
                    val pathList = mutableListOf<Pair<String?, String>>(null to "Home")
                    pathList.addAll(response.data.map { it.id to it.name })
                    _currentPath.value = pathList
                }
            } catch (e: Exception) {
                // Fallback: manually update if API fails (stack-based)
                // But preferred is API as it is more robust for deep links
            }
        }
    }

    private fun mapEntityToUiModel(entity: FileEntity): FolderData {
        val (icon, color) = if (entity.type == "folder") {
            getFolderIconAndColor(entity.name)
        } else {
             // Provide a default color for files instead of Color.Unspecified to avoid copy() crash
             UiUtils.getFileIcon(entity.mimeType) to V8idColors.UI.TextSecondary
        }
        
        return FolderData(
            id = entity.id,
            name = entity.name,
            size = if(entity.type == "folder") "" else UiUtils.formatFileSize(entity.size),
            icon = icon,
            iconColor = if (entity.color != null) UiUtils.parseColor(entity.color, color) else color,
            isFolder = entity.type == "folder",
            mimeType = entity.mimeType,
            thumbnailUrl = entity.thumbnailUrl
        )
    }

    /**
     * Search implementation remains similar but could be enhanced 
     * to use the local DB for offline search in the future
     */
    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        
        if (query.isEmpty()) {
            _searchResults.value = emptyList()
            return
        }
        
        searchJob = viewModelScope.launch {
            delay(300)
            try {
                // Keep using API for global search for now
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
                        icon = if (item.type == "folder") Icons.Outlined.Folder else UiUtils.getFileIcon(item.mimeType)
                    )
                }
            } catch (e: Exception) {
                 // Offline fall-back could go here
                _searchResults.value = emptyList()
            }
        }
    }
    
    fun clearSearch() {
        _searchQuery.value = ""
        _searchResults.value = emptyList()
    }

    // Helper: Logic to style folders
    private fun getFolderIconAndColor(name: String): Pair<ImageVector, Color> {
        val lowerName = name.lowercase()
        return when {
            lowerName.contains("document") -> Icons.Default.Description to Color(0xFFFFC107)
            lowerName.contains("photo") || lowerName.contains("image") -> Icons.Default.PhotoLibrary to Color(0xFF4CAF50)
            lowerName.contains("video") -> Icons.Default.VideoLibrary to Color(0xFFE91E63)
            lowerName.contains("music") || lowerName.contains("audio") -> Icons.Default.LibraryMusic to Color(0xFF9C27B0)
            lowerName.contains("download") -> Icons.Default.Download to Color(0xFFE91E63)
            lowerName.contains("archive") -> Icons.Default.Archive to Color(0xFFFFC107)
            lowerName.contains("presentation") -> Icons.Default.Slideshow to Color(0xFF4CAF50)
            else -> Icons.Default.Folder to Color(0xFF7C3AED)
        }
    }
}
