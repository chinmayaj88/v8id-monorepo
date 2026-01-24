package com.v8idcloud.core.data.repository

import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.network.SearchResultItemDto
import com.v8idcloud.core.data.paging.FilePagingSource
import com.v8idcloud.core.common.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

interface FileRepository {
    fun getFilesStream(folderId: String?): Flow<PagingData<SearchResultItemDto>>
    
    // Dashboard (Network Only)
    fun getDashboardData(): Flow<Result<DashboardData>>
}

data class DashboardData(
    val storageTotal: Long,
    val storageUsed: Long,
    val storagePercentage: Double,
    val totalFiles: Int,
    val totalFolders: Int,
    val recentFiles: List<SearchResultItemDto>
)

@Singleton
class FileRepositoryImpl @Inject constructor(
    private val apiService: FileApiService
) : FileRepository {

    override fun getFilesStream(folderId: String?): Flow<PagingData<SearchResultItemDto>> {
        return Pager(
            config = PagingConfig(
                pageSize = 20,
                enablePlaceholders = false,
                initialLoadSize = 20
            ),
            pagingSourceFactory = { FilePagingSource(apiService, folderId) }
        ).flow
    }

    override fun getDashboardData(): Flow<Result<DashboardData>> = flow {
        emit(Result.Loading)
        try {
            val response = apiService.getDashboardData()
            if (response.success && response.data != null) {
                val data = response.data!!
                val result = DashboardData(
                    storageTotal = data.storage.total,
                    storageUsed = data.storage.used,
                    storagePercentage = data.storage.percentage,
                    totalFiles = data.stats.totalFiles,
                    totalFolders = data.stats.totalFolders,
                    recentFiles = data.recentFiles
                )
                emit(Result.Success(result))
            } else {
                emit(Result.Error(Exception(response.message ?: "Failed to fetch dashboard")))
            }
        } catch (e: Exception) {
            emit(Result.Error(e))
        }
    }
}
