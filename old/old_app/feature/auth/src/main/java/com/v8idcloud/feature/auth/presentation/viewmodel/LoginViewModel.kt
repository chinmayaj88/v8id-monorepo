package com.v8idcloud.feature.auth.presentation.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.data.network.AuthApiService
import com.v8idcloud.core.data.network.VerifyCredentialsRequest
import com.v8idcloud.core.data.storage.StorageManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authApiService: AuthApiService,
    private val storageManager: StorageManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    companion object {
        private const val TAG = "LoginViewModel"
    }
    
    /**
     * Login function
     * Step 1: Verify credentials and get temporary token
     */
    fun login(email: String, password: String) {
        val trimmedEmail = email.trim()
        if (trimmedEmail.isBlank() || password.isBlank()) {
            _uiState.value = LoginUiState.Error("Email and password are required")
            return
        }
        
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            Log.d(TAG, "Login attempt for: $trimmedEmail")
            
            try {
                val response = authApiService.verifyCredentials(
                    VerifyCredentialsRequest(email = trimmedEmail, password = password)
                )
                Log.d(TAG, "Login response: isSuccessful=${response.isSuccessful}, code=${response.code()}")
                
                if (!response.isSuccessful) {
                    Log.e(TAG, "Error body: ${response.errorBody()?.string()}")
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        val data = apiResponse.data!!
                        
                        // Save temporary token for TOTP verification
                        storageManager.saveTempToken(data.tempToken)
                        
                        // Save user info (optional, for UI display)
                        storageManager.saveUserInfo(
                            userId = data.user.id,
                            email = data.user.email,
                            firstName = data.user.firstName,
                            lastName = data.user.lastName,
                            avatarUrl = data.user.avatarUrl,
                            storageQuota = data.user.storageQuota,
                            storageUsed = data.user.storageUsed,
                            storagePercentage = data.user.storagePercentage?.toString(),
                            storageUsedFormatted = data.user.storageUsedFormatted,
                            storageQuotaFormatted = data.user.storageQuotaFormatted
                        )
                        
                        // Navigate to TOTP screen
                        Log.i(TAG, "Login successful, requires TOTP for: ${data.user.email}")
                        _uiState.value = LoginUiState.RequiresTotp(
                            tempToken = data.tempToken,
                            userEmail = data.user.email
                        )
                    } else {
                        // Handle error in response
                        val errorMessage = apiResponse.error?.message 
                            ?: apiResponse.message 
                            ?: "Login failed"
                        Log.e(TAG, "Login failed: $errorMessage")
                        _uiState.value = LoginUiState.Error(errorMessage)
                    }
                } else {
                    // Handle HTTP error - backend returns error in ApiResponse format
                    val errorMessage = parseErrorResponse(response.errorBody()?.string())
                    Log.e(TAG, "Login HTTP error: $errorMessage")
                    _uiState.value = LoginUiState.Error(errorMessage)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Login exception", e)
                _uiState.value = LoginUiState.Error(
                    e.message ?: "Network error. Please check your connection."
                )
            }
        }
    }
    
    /**
     * Reset UI state
     */
    fun resetState() {
        _uiState.value = LoginUiState.Idle
    }
    
    /**
     * Parse error response from backend
     */
    private fun parseErrorResponse(errorBody: String?): String {
        if (errorBody == null) return "Invalid credentials"
        
        return try {
            val errorResponse = com.google.gson.Gson().fromJson(
                errorBody,
                com.v8idcloud.core.data.network.ApiResponse::class.java
            )
            errorResponse.error?.message 
                ?: errorResponse.message 
                ?: "Invalid credentials"
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse error response", e)
            "Invalid credentials"
        }
    }
}

/**
 * Login UI State
 * Sealed interface for type-safe state management
 */
sealed interface LoginUiState {
    object Idle : LoginUiState
    object Loading : LoginUiState
    data class RequiresTotp(
        val tempToken: String,
        val userEmail: String
    ) : LoginUiState
    data class Error(val message: String) : LoginUiState
}
