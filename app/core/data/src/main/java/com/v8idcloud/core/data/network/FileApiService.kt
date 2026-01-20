package com.v8idcloud.core.data.network

import retrofit2.http.GET
import retrofit2.http.Query

interface FileApiService {


    @GET("files/search")
    suspend fun unifiedSearch(
        @Query("q") query: String,
        @Query("limit") limit: Int = 10
    ): FileApiResponse<UnifiedSearchResponseDto>
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
    val updatedAt: String
)

data class UnifiedSearchResponseDto(
    val results: List<SearchResultItemDto>,
    val total: Int
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
