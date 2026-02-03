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
    data class Success(
        val url: String, 
        val name: String, 
        val mimeType: String,
        val localFile: java.io.File? = null,
        val textContent: String? = null
    ) : FileViewerUiState()
    data class Error(val message: String) : FileViewerUiState()
}

@HiltViewModel
class FileViewerViewModel @Inject constructor(
    private val fileApiService: FileApiService,
    private val configProvider: com.v8idcloud.core.common.ConfigProvider,
    private val okHttpClient: okhttp3.OkHttpClient,
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: android.content.Context,
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
                    
                    var fullUrl = if (rawUrl.startsWith("http")) rawUrl else "$adjustedBase/${rawUrl.trimStart('/')}"
                    
                    // Fix for Android Emulator accessing localhost
                    if (fullUrl.contains("localhost")) {
                        fullUrl = fullUrl.replace("localhost", "10.0.2.2")
                    }
                    
                    var localFile: java.io.File? = null
                    var textContent: String? = null

                    try {
                        if (fileType.startsWith("text/")) {
                            textContent = downloadText(fullUrl)
                        } else if (fileType == "application/pdf") {
                            localFile = downloadFile(fullUrl, "temp_pdf_${System.currentTimeMillis()}.pdf")
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        // If download fails, we still return Success with the URL so the user can try external link
                    }
                    
                    _uiState.value = FileViewerUiState.Success(
                        url = fullUrl,
                        name = fileName,
                        mimeType = fileType,
                        localFile = localFile,
                        textContent = textContent
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

    private suspend fun downloadText(url: String): String {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val request = okhttp3.Request.Builder().url(url).build()
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) throw java.io.IOException("Failed to download text: ${response.code}")
            response.body?.string() ?: ""
        }
    }

    private suspend fun downloadFile(url: String, fileName: String): java.io.File {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            val request = okhttp3.Request.Builder().url(url).build()
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) throw java.io.IOException("Failed to download file: ${response.code}")
            
            val file = java.io.File(context.cacheDir, fileName)
            response.body?.byteStream()?.use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            file
        }
    }
}
