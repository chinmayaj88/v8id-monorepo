package com.v8idcloud.core.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * API Service Interface
 * Equivalent to axios API calls
 * Retrofit automatically handles HTTP requests
 */

// Request DTOs (Data Transfer Objects)
data class VerifyCredentialsRequest(
    val email: String,
    val password: String
)

data class VerifyTotpRequest(
    val tempToken: String,
    val totpCode: String,
    val deviceType: String, // "MOBILE" or "WEB"
    val deviceName: String,
    val deviceId: String,
    val rememberMe: Boolean? = null
)

data class LogoutRequest(
    val sessionId: String
)

// Response DTOs - Backend uses ResponseUtil.success() which returns this structure
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?,
    val meta: Map<String, Any>? = null,
    val error: ErrorResponse? = null
)

// Error response structure matches backend ResponseUtil.error()
data class ErrorResponse(
    val code: String,
    val message: String,
    val details: Any? = null
)

// Backend returns VerifyCredentialsResult directly in data field
data class VerifyCredentialsResponse(
    val requiresTotp: Boolean,
    val tempToken: String,
    val user: UserDto
)

// Backend returns VerifyTotpLoginResult directly in data field
data class VerifyTotpResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val deviceSession: DeviceSessionDto,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val avatarUrl: String?,
    val role: String,
    val storageQuota: String? = null,
    val storageUsed: String? = null
)

data class DeviceSessionDto(
    val id: String,
    val deviceType: String,
    val deviceName: String,
    val deviceId: String?,
    val ipAddress: String?,
    val userAgent: String?,
    val location: String?,
    val lastActiveAt: String?,
    val createdAt: String?,
    val expiresAt: String?
)

data class DeviceSessionsResponse(
    val sessions: List<DeviceSessionDto>
)

data class StorageAnalyticsDto(
    val totalStorage: Long? = null, // Changed from totalQuota (String)
    val usedStorage: Long? = null,  // Changed from totalUsed (String)
    val availableStorage: Long? = null,
    val breakdownByType: List<StorageBreakdownItem>? = null
)

data class StorageBreakdownItem(
    val type: String?,
    val count: Int?,
    val size: Long?,
    val percentage: Double?
)

// Removing UsageByTierDto and UsageByTypeDto as they are no longer used by the actual response structure

/**
 * Auth API Service
 * Similar to axios.create() with baseURL
 */
interface AuthApiService {
    
    /**
     * POST /api/auth/verify-credentials
     * Step 1: Verify email and password, return temporary token
     * Note: BASE_URL already includes /api/, so endpoint is just "auth/verify-credentials"
     */
    @POST("auth/verify-credentials")
    suspend fun verifyCredentials(
        @Body request: VerifyCredentialsRequest
    ): Response<ApiResponse<VerifyCredentialsResponse>>
    
    /**
     * POST /api/auth/verify-totp
     * Step 2: Verify TOTP code using temporary token, return access and refresh tokens
     * Note: BASE_URL already includes /api/, so endpoint is just "auth/verify-totp"
     */
    @POST("auth/verify-totp")
    suspend fun verifyTotp(
        @Body request: VerifyTotpRequest
    ): Response<ApiResponse<VerifyTotpResponse>>
    
    /**
     * POST /api/auth/logout
     * Logout user by revoking session
     * Note: BASE_URL already includes /api/, so endpoint is just "auth/logout"
     */
    @POST("auth/logout")
    suspend fun logout(
        @Header("Authorization") token: String,
        @Body request: LogoutRequest
    ): Response<ApiResponse<Unit>>
}
