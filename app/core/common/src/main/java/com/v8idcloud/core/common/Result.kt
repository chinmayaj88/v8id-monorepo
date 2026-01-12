package com.v8idcloud.core.common

/**
 * A generic class that holds a value or an exception
 */
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

/**
 * Extension function to convert Result to Kotlin Result
 */
fun <T> Result<T>.toKotlinResult(): kotlin.Result<T> {
    return when (this) {
        is Result.Success -> kotlin.Result.success(data)
        is Result.Error -> kotlin.Result.failure(exception)
        is Result.Loading -> kotlin.Result.failure(IllegalStateException("Result is still loading"))
    }
}
