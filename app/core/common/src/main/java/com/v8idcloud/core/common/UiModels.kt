package com.v8idcloud.core.common

import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.Color

/**
 * Common UI model for files
 */
data class FileItem(
    val id: String,
    val name: String,
    val size: String,
    val timeAgo: String,
    val icon: ImageVector,
    val thumbnailUrl: String? = null,
    val mimeType: String? = null
)

/**
 * Common UI model for folders
 */
data class FolderData(
    val id: String,
    val name: String,
    val size: String,
    val icon: ImageVector,
    val iconColor: Color
)

/**
 * Common UI model for search suggestions
 */
data class SearchSuggestion(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: SuggestionType,
    val icon: ImageVector? = null
)

enum class SuggestionType {
    FILE, FOLDER
}

