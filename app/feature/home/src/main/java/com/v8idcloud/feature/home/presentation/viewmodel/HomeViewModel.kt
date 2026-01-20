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
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import javax.inject.Inject
import com.v8idcloud.core.data.network.FileApiService

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
        loadUserInfo()
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
                // Use unified search endpoint
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
                // Handle general error by clearing suggestions
                // In production, might want to show error state in UI
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
     * Load user information from storage
     */
    private fun loadUserInfo() {
        viewModelScope.launch {
            try {
                storageManager.getUserId().first()
                _uiState.value = HomeUiState.Loaded
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Failed to load user info")
            }
        }
    }
    
    /**
     * Logout function
     * Clears local auth data and optionally calls logout API
     */
    fun logout(onLogoutSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = HomeUiState.LoggingOut
            
            try {
                val accessToken = storageManager.getAccessTokenSync()
                val sessionId = storageManager.getSessionIdSync()
                
                // Attempt API logout if credentials available
                if (accessToken != null && sessionId != null) {
                    runCatching {
                        authApiService.logout(
                            token = "Bearer $accessToken",
                            request = LogoutRequest(sessionId = sessionId)
                        )
                    }
                }
            } catch (e: Exception) {
                // Log error but continue with logout
                android.util.Log.e("HomeViewModel", "Logout error", e)
            } finally {
                // Always clear local data regardless of API result
                storageManager.clearAuthData()
                _uiState.value = HomeUiState.LoggedOut
                onLogoutSuccess()
            }
        }
    }
}

/**
 * Home UI State
 * Sealed interface for type-safe state management
 */
sealed interface HomeUiState {
    object Loading : HomeUiState
    object Loaded : HomeUiState
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
