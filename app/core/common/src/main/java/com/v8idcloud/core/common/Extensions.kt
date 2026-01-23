package com.v8idcloud.core.common

import android.util.Patterns

/**
 * Common extension functions used across the app
 */

/**
 * Check if string is a valid email format
 */
fun String.isValidEmail(): Boolean = Patterns.EMAIL_ADDRESS.matcher(this).matches()

/**
 * Format file size in bytes to human-readable string (KB, MB, GB)
 */
fun Long.formatFileSize(): String {
    val kb = this / 1024.0
    val mb = kb / 1024.0
    val gb = mb / 1024.0
    
    return when {
        gb >= 1 -> String.format("%.1f GB", gb)
        mb >= 1 -> String.format("%.1f MB", mb)
        kb >= 1 -> String.format("%.1f KB", kb)
        else -> "$this B"
    }
}

/**
 * Format timestamp (Long) to relative time
 */
fun Long.formatTimeAgo(): String {
    val now = System.currentTimeMillis()
    val diff = now - this
    
    val seconds = diff / 1000
    val minutes = seconds / 60
    val hours = minutes / 60
    val days = hours / 24
    
    return when {
        days > 7 -> {
             val outputSdf = java.text.SimpleDateFormat("MMM dd, yyyy", java.util.Locale.US)
             outputSdf.format(java.util.Date(this))
        }
        days >= 1 -> "$days ${if (days == 1L) "day" else "days"} ago"
        hours >= 1 -> "$hours ${if (hours == 1L) "hour" else "hours"} ago"
        minutes >= 1 -> "$minutes ${if (minutes == 1L) "min" else "mins"} ago"
        else -> "Just now"
    }
}

/**
 * Format timestamp (ISO or Long) to relative time (e.g., "2 hours ago")
 */
fun String?.formatTimeAgo(): String {
    if (this.isNullOrBlank()) return "Recently"
    
    // Check if it's a Long string
    val timestamp = this.toLongOrNull()
    if (timestamp != null) {
        return timestamp.formatTimeAgo()
    }
    
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
        sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = sdf.parse(this) ?: return "Recently"
        date.time.formatTimeAgo()
    } catch (e: Exception) {
        "Recently"
    }
}
