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
     */
    fun downloadFile(context: android.content.Context, url: String, fileName: String) {
        try {
            val request = android.app.DownloadManager.Request(android.net.Uri.parse(url))
                .setTitle(fileName)
                .setDescription("Downloading file...")
                .setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
            downloadManager.enqueue(request)
            
            android.widget.Toast.makeText(context, "Download started", android.widget.Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            android.widget.Toast.makeText(context, "Download failed: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
        }
    }
}
