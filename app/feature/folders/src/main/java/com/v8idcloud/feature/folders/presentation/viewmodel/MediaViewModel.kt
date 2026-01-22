package com.v8idcloud.feature.folders.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.network.SearchResultItemDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class MediaUiState {
    object Loading : MediaUiState()
    data class Success(val files: List<SearchResultItemDto>) : MediaUiState()
    data class Error(val message: String) : MediaUiState()
    object Empty : MediaUiState()
}

@HiltViewModel
class MediaViewModel @Inject constructor(
    private val fileApiService: FileApiService,
    private val savedStateHandle: androidx.lifecycle.SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<MediaUiState>(MediaUiState.Loading)
    val uiState: StateFlow<MediaUiState> = _uiState.asStateFlow()

    private val _selectedCategory = MutableStateFlow(savedStateHandle.get<String>("type") ?: "IMAGE")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    init {
        loadMedia(_selectedCategory.value)
    }

    fun onCategorySelected(category: String) {
        _selectedCategory.value = category
        loadMedia(category)
    }

    fun loadMedia(type: String) {
        viewModelScope.launch {
            _uiState.value = MediaUiState.Loading
            try {
                val response = fileApiService.getFiles(type = type.uppercase(), limit = 50)
                if (response.success) {
                    val files = response.data
                    if (files.isEmpty()) {
                        _uiState.value = MediaUiState.Empty
                    } else {
                        // Filter out folders just in case, though API should handle it
                        val mediaFiles = files.filter { it.type != "folder" }
                        _uiState.value = MediaUiState.Success(mediaFiles)
                    }
                } else {
                    _uiState.value = MediaUiState.Error(response.message ?: "Failed to load media")
                }
            } catch (e: Exception) {
                _uiState.value = MediaUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
