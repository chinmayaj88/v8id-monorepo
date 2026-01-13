package com.v8idcloud.feature.auth.presentation.viewmodel

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
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authApiService: AuthApiService,
    private val storageManager: StorageManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
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
