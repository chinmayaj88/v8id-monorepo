package com.v8idcloud.feature.folders.presentation.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.data.network.FileApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class FileViewerUiState {
    object Loading : FileViewerUiState()
    data class Success(val url: String, val name: String, val mimeType: String) : FileViewerUiState()
    data class Error(val message: String) : FileViewerUiState()
}

@HiltViewModel
class FileViewerViewModel @Inject constructor(
    private val fileApiService: FileApiService,
    private val configProvider: com.v8idcloud.core.common.ConfigProvider,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<FileViewerUiState>(FileViewerUiState.Loading)
    val uiState: StateFlow<FileViewerUiState> = _uiState.asStateFlow()

    private val fileId: String = checkNotNull(savedStateHandle["fileId"])
    private val fileName: String = savedStateHandle["fileName"] ?: "File"
    private val fileType: String = savedStateHandle["fileType"] ?: "*/*"

    init {
        loadFile()
    }

    fun loadFile() {
        viewModelScope.launch {
            _uiState.value = FileViewerUiState.Loading
            try {
                // Generate a temporary link for viewing
                val response = fileApiService.generateLink(fileId)
                if (response.success) {
                    val rawUrl = response.data.linkUrl
                    val baseUrl = configProvider.baseUrl.trimEnd('/')
                    // If rawUrl starts with /api/ and baseUrl ends with /api, remove one /api from base
                    val adjustedBase = if (baseUrl.endsWith("/api") && rawUrl.startsWith("/api/")) {
                        baseUrl.removeSuffix("/api")
                    } else {
                        baseUrl
                    }
                    
                    val fullUrl = if (rawUrl.startsWith("http")) rawUrl else "$adjustedBase/${rawUrl.trimStart('/')}"
                    
                    _uiState.value = FileViewerUiState.Success(
                        url = fullUrl,
                        name = fileName,
                        mimeType = fileType
                    )
                } else {
                    val errorMsg = if (response.message?.contains("400") == true) "Invalid request: ${response.message}" else response.message ?: "Failed to generate link"
                    _uiState.value = FileViewerUiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _uiState.value = FileViewerUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
