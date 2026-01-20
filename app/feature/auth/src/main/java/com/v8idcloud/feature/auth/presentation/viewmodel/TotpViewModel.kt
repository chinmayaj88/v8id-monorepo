package com.v8idcloud.feature.auth.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.common.DeviceInfo
import com.v8idcloud.core.data.network.AuthApiService
import com.v8idcloud.core.data.network.VerifyTotpRequest
import com.v8idcloud.core.data.storage.StorageManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TotpViewModel @Inject constructor(
    private val authApiService: AuthApiService,
    private val storageManager: StorageManager,
    private val deviceInfo: DeviceInfo
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<TotpUiState>(TotpUiState.Idle)
    val uiState: StateFlow<TotpUiState> = _uiState.asStateFlow()
    
    /**
     * Verify TOTP function
     * Step 2: Verify TOTP code using temporary token
     */
    fun verifyTotp(totpCode: String) {
        val trimmedCode = totpCode.trim()
        if (trimmedCode.length != 6 || !trimmedCode.all(Char::isDigit)) {
            _uiState.value = TotpUiState.Error("Please enter a valid 6-digit code")
            return
        }
        
        viewModelScope.launch {
            _uiState.value = TotpUiState.Loading
            
            try {
                // Get temporary token from storage
                val tempToken = storageManager.getTempTokenSync()
                    ?: run {
                        _uiState.value = TotpUiState.Error("Session expired. Please login again.")
                        return@launch
                    }
                
                // Get device information
                val deviceId = deviceInfo.getDeviceId()
                val deviceName = deviceInfo.getDeviceName()
                val deviceType = deviceInfo.getDeviceType()
                
                val response = authApiService.verifyTotp(
                    VerifyTotpRequest(
                        tempToken = tempToken,
                        totpCode = trimmedCode,
                        deviceType = deviceType,
                        deviceName = deviceName,
                        deviceId = deviceId,
                        rememberMe = null
                    )
                )
                
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    if (apiResponse.success && apiResponse.data != null) {
                        val data = apiResponse.data!!
                        
                        // Save tokens and user info
                        storageManager.saveAccessToken(data.accessToken)
                        storageManager.saveRefreshToken(data.refreshToken)
                        storageManager.saveSessionId(data.deviceSession.id)
                        storageManager.saveUserInfo(
                            userId = data.user.id,
                            email = data.user.email,
                            firstName = data.user.firstName,
                            lastName = data.user.lastName,
                            avatarUrl = data.user.avatarUrl
                        )
                        
                        // Clear temporary token
                        storageManager.clearTempToken()
                        
                        // Success - navigate to home
                        _uiState.value = TotpUiState.Success(
                            userEmail = data.user.email,
                            userName = buildString {
                                append(data.user.firstName?.takeIf { it.isNotBlank() } ?: "")
                                if (data.user.lastName?.isNotBlank() == true) {
                                    if (isNotEmpty()) append(" ")
                                    append(data.user.lastName)
                                }
                            }.takeIf { it.isNotBlank() } ?: data.user.email
                        )
                    } else {
                        _uiState.value = TotpUiState.Error(
                            apiResponse.message ?: "TOTP verification failed"
                        )
                    }
                } else {
                    // Handle HTTP error
                    val errorMessage = parseErrorResponse(response.errorBody()?.string())
                    _uiState.value = TotpUiState.Error(errorMessage)
                }
            } catch (e: Exception) {
                _uiState.value = TotpUiState.Error(
                    e.message ?: "Network error. Please check your connection."
                )
            }
        }
    }
    
    /**
     * Reset UI state
     */
    fun resetState() {
        _uiState.value = TotpUiState.Idle
    }
    
    /**
     * Parse error response from backend
     */
    private fun parseErrorResponse(errorBody: String?): String {
        if (errorBody == null) return "Invalid TOTP code. Please try again."
        
        return try {
            val errorResponse = com.google.gson.Gson().fromJson(
                errorBody,
                com.v8idcloud.core.data.network.ApiResponse::class.java
            )
            errorResponse.error?.message 
                ?: errorResponse.message 
                ?: "TOTP verification failed"
        } catch (e: Exception) {
            "Invalid TOTP code. Please try again."
        }
    }
}

/**
 * TOTP UI State
 * Sealed interface for type-safe state management
 */
sealed interface TotpUiState {
    object Idle : TotpUiState
    object Loading : TotpUiState
    data class Success(
        val userEmail: String,
        val userName: String
    ) : TotpUiState
    data class Error(val message: String) : TotpUiState
}
