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
 * Check if string is not blank and not empty
 * Note: This is redundant as isNotBlank() already checks for empty
 */
@Deprecated("Use isNotBlank() instead", ReplaceWith("isNotBlank()"))
fun String.isNotBlankOrEmpty(): Boolean = isNotBlank()
