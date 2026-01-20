package com.v8idcloud.core.data.network

import retrofit2.http.GET
import retrofit2.http.Query

interface FileApiService {

    @GET("files/search")
    suspend fun unifiedSearch(
        @Query("q") query: String,
        @Query("limit") limit: Int = 10
    ): FileApiResponse<UnifiedSearchResponseDto>
    
    @GET("files/dashboard")
    suspend fun getDashboardData(): FileApiResponse<DashboardResponseDto>

    @GET("files/{id}")
    suspend fun getFile(@retrofit2.http.Path("id") id: String): FileApiResponse<SearchResultItemDto>

    @retrofit2.http.DELETE("files/{id}")
    suspend fun deleteFile(@retrofit2.http.Path("id") id: String): FileApiResponse<Unit>

    @retrofit2.http.POST("files/{id}/link")
    suspend fun generateLink(
        @retrofit2.http.Path("id") id: String,
        @retrofit2.http.Body request: GenerateLinkRequest = GenerateLinkRequest()
    ): FileApiResponse<FileLinkResponseDto>
}

data class FileApiResponse<T>(
    val success: Boolean,
    val data: T,
    val message: String?,
    val meta: MetaData?
)

data class MetaData(
    val pagination: Pagination?
)

data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int
)

data class FileDto(
    val id: String,
    val name: String,
    val type: String,
    val size: Long,
    val updatedAt: String
)

data class FolderDto(
    val id: String,
    val name: String,
    val updatedAt: String,
    val color: String? = null
)

data class UnifiedSearchResponseDto(
    val results: List<SearchResultItemDto>,
    val total: Int
)

data class DashboardResponseDto(
    val storage: StorageStatsDto,
    val recentFiles: List<SearchResultItemDto>,
    val folders: List<FolderDto>,
    val stats: DashboardStatsDto
)

data class StorageStatsDto(
    val total: Long,
    val used: Long,
    val percentage: Double
)

data class DashboardStatsDto(
    val totalFiles: Int,
    val totalFolders: Int
)

data class SearchResultItemDto(
    val id: String,
    val type: String, // "file" or "folder"
    val name: String,
    val description: String?,
    val updatedAt: String,
    val mimeType: String?, // files only
    val size: Long?,       // files only
    val thumbnailUrl: String?, // files only
    val color: String?,    // folders only
    val parentId: String?  // folders only
)

data class GenerateLinkRequest(
    val expiresInHours: Int = 24,
    val maxDownloads: Int? = null
)

data class FileLinkResponseDto(
    val id: String,
    val linkToken: String,
    val linkUrl: String,
    val expiresAt: String,
    val maxDownloads: Int?,
    val downloadCount: Int
)
