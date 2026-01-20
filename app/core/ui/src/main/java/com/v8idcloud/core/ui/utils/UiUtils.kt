package com.v8idcloud.core.ui.utils

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

object UiUtils {
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
    fun downloadFile(context: android.content.Context, url: String, fileName: String): Long {
        try {
            val request = android.app.DownloadManager.Request(android.net.Uri.parse(url))
                .setTitle(fileName)
                .setDescription("Downloading from V8id Cloud...")
                .setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
            val downloadId = downloadManager.enqueue(request)
            
            android.widget.Toast.makeText(context, "Download started", android.widget.Toast.LENGTH_SHORT).show()
            return downloadId
        } catch (e: Exception) {
            android.widget.Toast.makeText(context, "Download failed: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
            return -1L
        }
    }
    
    /**
     * Get download progress for a given download ID
     * Returns a pair of (bytesDownloaded, totalBytes)
     */
    fun getDownloadProgress(context: android.content.Context, downloadId: Long): Pair<Long, Long> {
        val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
        val query = android.app.DownloadManager.Query().setFilterById(downloadId)
        val cursor = downloadManager.query(query)
        
        if (cursor.moveToFirst()) {
            val bytesDownloadedIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
            val totalBytesIndex = cursor.getColumnIndex(android.app.DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
            
            val bytesDownloaded = if (bytesDownloadedIndex >= 0) cursor.getLong(bytesDownloadedIndex) else 0L
            val totalBytes = if (totalBytesIndex >= 0) cursor.getLong(totalBytesIndex) else 0L
            
            cursor.close()
            return Pair(bytesDownloaded, totalBytes)
        }
        cursor.close()
        return Pair(0L, 0L)
    }
}
