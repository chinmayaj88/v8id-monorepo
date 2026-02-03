package com.v8idcloud.core.common

/**
 * A generic sealed class that holds a value or an exception
 * Modern Kotlin approach using sealed classes for type-safe state handling
 */
sealed interface Result<out T> {
    data class Success<T>(val data: T) : Result<T>
    data class Error(val exception: Throwable) : Result<Nothing>
    object Loading : Result<Nothing>
}

/**
 * Extension function to convert Result to Kotlin Result
 */
fun <T> Result<T>.toKotlinResult(): kotlin.Result<T> = when (this) {
    is Result.Success -> kotlin.Result.success(data)
    is Result.Error -> kotlin.Result.failure(exception)
    is Result.Loading -> kotlin.Result.failure(IllegalStateException("Result is still loading"))
}
