package com.v8idcloud.core.ui.utils

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

object UiUtils {
    /**
     * Prepare a file part for multipart upload from a Uri
     */
    fun prepareFilePart(context: android.content.Context, partName: String, fileUri: android.net.Uri): MultipartBody.Part? {
        return try {
            val contentResolver = context.contentResolver
            val inputStream = contentResolver.openInputStream(fileUri) ?: return null
            val file = File(context.cacheDir, "upload_${System.currentTimeMillis()}.tmp")
            val outputStream = FileOutputStream(file)
            inputStream.use { input ->
                outputStream.use { output ->
                    input.copyTo(output)
                }
            }
            val requestFile = file.asRequestBody(
                contentResolver.getType(fileUri)?.toMediaTypeOrNull()
            )
            MultipartBody.Part.createFormData(partName, file.name, requestFile)
        } catch (e: Exception) {
            android.util.Log.e("UiUtils", "Failed to prepare file part", e)
            null
        }
    }
    /**
     * Get appropriate icon for a mime type
     */
    fun getFileIcon(mimeType: String?): ImageVector {
        val type = mimeType ?: ""
        return when {
            type.startsWith("image/") -> Icons.Default.Image
            type.startsWith("video/") -> Icons.Default.VideoFile
            type.contains("pdf") -> Icons.Default.Description
            else -> Icons.Default.InsertDriveFile
        }
    }

    /**
     * Format file size in bytes to human-readable string
     */
    fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        val units = arrayOf("B", "KB", "MB", "GB", "TB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        val clampedGroup = digitGroups.coerceIn(0, units.size - 1)
        return String.format("%.1f %s", bytes / Math.pow(1024.0, clampedGroup.toDouble()), units[clampedGroup])
    }

    /**
     * Parse hex color string to Compose Color
     */
    fun parseColor(colorString: String?, defaultColor: Color = Color(0xFF6B4EE6)): Color {
        return try {
            if (colorString != null && colorString.startsWith("#")) {
                Color(android.graphics.Color.parseColor(colorString))
            } else {
                defaultColor
            }
        } catch (e: Exception) {
            defaultColor
        }
    }

    /**
     * Download a file using Android DownloadManager
     * Returns the download ID for tracking progress
     */
    fun downloadFile(
        context: android.content.Context, 
        url: String, 
        fileName: String, 
        mimeType: String? = null,
        authToken: String? = null
    ): Long {
        try {
            val request = android.app.DownloadManager.Request(android.net.Uri.parse(url))
                .setTitle(fileName)
                .setDescription("Downloading from V8id Cloud...")
                .setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
            
            if (mimeType != null) {
                request.setMimeType(mimeType)
            }
            
            if (authToken != null) {
                request.addRequestHeader("Authorization", "Bearer $authToken")
                android.util.Log.d("UiUtils", "Added auth header to download request")
            }

            val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
            val downloadId = downloadManager.enqueue(request)
            
            android.util.Log.d("UiUtils", "Download enqueued with ID: $downloadId")
            android.widget.Toast.makeText(context, "Download started", android.widget.Toast.LENGTH_SHORT).show()
            return downloadId
        } catch (e: Exception) {
            android.util.Log.e("UiUtils", "Download failed", e)
            return -1L
        }
    }
    
    data class DownloadStatus(
        val id: Long,
        val status: Int, // DownloadManager.STATUS_*
        val reason: Int, 
        val bytesDownloaded: Long,
        val totalBytes: Long
    )
    
    /**
     * Get download progress for a given download ID
     * Returns DownloadStatus containing status, reason and progress
     */
    fun getDownloadProgress(context: android.content.Context, downloadId: Long): DownloadStatus {
        val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
        val query = android.app.DownloadManager.Query().setFilterById(downloadId)
        val cursor = downloadManager.query(query)
        
        if (cursor.moveToFirst()) {
            val statusIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_STATUS)
            val reasonIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_REASON)
            val bytesDownloadedIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
            val totalBytesIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
            
            val status = if (statusIndex >= 0) cursor.getInt(statusIndex) else 0
            val reason = if (reasonIndex >= 0) cursor.getInt(reasonIndex) else 0
            val bytesDownloaded = if (bytesDownloadedIndex >= 0) cursor.getLong(bytesDownloadedIndex) else 0L
            val totalBytes = if (totalBytesIndex >= 0) cursor.getLong(totalBytesIndex) else 0L
            
            cursor.close()
            return DownloadStatus(downloadId, status, reason, bytesDownloaded, totalBytes)
        }
        cursor.close()
        return DownloadStatus(downloadId, android.app.DownloadManager.STATUS_FAILED, 0, 0L, 0L)
    }
}

