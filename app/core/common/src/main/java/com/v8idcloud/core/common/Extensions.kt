package com.v8idcloud.core.common

/**
 * Common extension functions used across the app
 */

/**
 * Check if string is a valid email format
 */
fun String.isValidEmail(): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
}

/**
 * Check if string is not blank and not empty
 */
fun String.isNotBlankOrEmpty(): Boolean {
    return this.isNotBlank() && this.isNotEmpty()
}
