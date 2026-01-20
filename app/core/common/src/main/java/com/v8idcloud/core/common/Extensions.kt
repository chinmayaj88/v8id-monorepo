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
 * Format timestamp (ISO or Long) to relative time (e.g., "2 hours ago")
 */
fun String?.formatTimeAgo(): String {
    if (this.isNullOrBlank()) return "Recently"
    
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
        sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = sdf.parse(this) ?: return "Recently"
        val now = System.currentTimeMillis()
        val diff = now - date.time
        
        val seconds = diff / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24
        
        when {
            days > 7 -> {
                 val outputSdf = java.text.SimpleDateFormat("MMM dd, yyyy", java.util.Locale.US)
                 outputSdf.format(date)
            }
            days >= 1 -> "$days ${if (days == 1L) "day" else "days"} ago"
            hours >= 1 -> "$hours ${if (hours == 1L) "hour" else "hours"} ago"
            minutes >= 1 -> "$minutes ${if (minutes == 1L) "min" else "mins"} ago"
            else -> "Just now"
        }
    } catch (e: Exception) {
        "Recently"
    }
}
