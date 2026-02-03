package com.v8idcloud.core.data.network

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.Part
import retrofit2.http.POST
import retrofit2.http.DELETE
import retrofit2.http.Path
import retrofit2.http.PUT

interface UserApiService {
    
    @GET("users/me")
    suspend fun getCurrentUser(): ApiResponse<UserDto>

    @Multipart
    @PUT("users/me/profile")
    suspend fun updateProfile(
        @Part avatar: MultipartBody.Part? = null,
        @Part("firstName") firstName: RequestBody? = null,
        @Part("lastName") lastName: RequestBody? = null
    ): ApiResponse<UserDto>
    @GET("users/me/storage")
    suspend fun getStorageAnalytics(): ApiResponse<StorageAnalyticsDto>

    @GET("users/me/sessions")
    suspend fun listSessions(): ApiResponse<DeviceSessionsResponse>

    @DELETE("users/me/sessions/{sessionId}")
    suspend fun revokeSession(@Path("sessionId") sessionId: String): ApiResponse<Unit>

    @POST("users/me/sessions/revoke-all")
    suspend fun revokeAllSessions(): ApiResponse<Unit>
}
