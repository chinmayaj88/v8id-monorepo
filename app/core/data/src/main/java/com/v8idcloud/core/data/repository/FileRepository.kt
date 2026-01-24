package com.v8idcloud.core.data.repository

import androidx.paging.ExperimentalPagingApi
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.room.withTransaction
import com.v8idcloud.core.data.local.V8idDatabase
import com.v8idcloud.core.data.local.entity.DashboardStatsEntity
import com.v8idcloud.core.data.local.entity.FileEntity
import com.v8idcloud.core.data.local.entity.RecentFileEntity
import com.v8idcloud.core.data.network.DashboardResponseDto
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.paging.FileRemoteMediator
import com.v8idcloud.core.common.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

interface FileRepository {
    fun getFilesStream(folderId: String?): Flow<PagingData<FileEntity>>
    
    // Dashboard (Offline First)
    fun getDashboardData(forceRefresh: Boolean): Flow<Result<DashboardData>>
}

data class DashboardData(
    val stats: DashboardStatsEntity?,
    val recentFiles: List<RecentFileEntity>
)

@Singleton
class FileRepositoryImpl @Inject constructor(
    private val apiService: FileApiService,
    private val database: V8idDatabase
) : FileRepository {

    @OptIn(ExperimentalPagingApi::class)
    override fun getFilesStream(folderId: String?): Flow<PagingData<FileEntity>> {
        return Pager(
            config = PagingConfig(
                pageSize = 20,
                enablePlaceholders = true,
                prefetchDistance = 10
            ),
            remoteMediator = FileRemoteMediator(
                folderId = folderId,
                apiService = apiService,
                database = database
            ),
            pagingSourceFactory = { database.fileDao().getFilesByParent(folderId) }
        ).flow
    }

    override fun getDashboardData(forceRefresh: Boolean): Flow<Result<DashboardData>> = channelFlow {
        val dao = database.dashboardDao()

        // 1. Emit Cache Immediately
        val cachedStats = dao.getStatsSync()
        val cachedFiles = dao.getRecentFilesSync()
        
        if (cachedStats != null || cachedFiles.isNotEmpty()) {
            send(Result.Success(DashboardData(cachedStats, cachedFiles)))
        } else {
             send(Result.Loading)
        }

        // 2. Fetch Network if needed
        val shouldFetch = forceRefresh || cachedStats == null || 
                         (System.currentTimeMillis() - cachedStats.lastUpdated > 60 * 60 * 1000) // 1 hr

        if (shouldFetch) {
            try {
                val response = apiService.getDashboardData()
                if (response.success && response.data != null) {
                    val data = response.data!!
                    
                    // Map to Entities
                    val statsEntity = DashboardStatsEntity(
                        id = 0,
                        storageUsed = data.storage.used,
                        storageTotal = data.storage.total,
                        storagePercentage = data.storage.percentage,
                        totalFiles = data.stats.totalFiles,
                        totalFolders = data.stats.totalFolders
                    )
                    
                    val fileEntities = data.recentFiles.map { dto ->
                        RecentFileEntity(
                            id = dto.id,
                            parentId = null,
                            name = dto.name,
                            type = dto.type,
                            mimeType = dto.mimeType,
                            size = dto.size ?: 0L,
                            thumbnailUrl = dto.thumbnailUrl,
                            color = dto.color,
                            updatedAt = System.currentTimeMillis() // Or dto.updatedAt
                        )
                    }

                    // Save to DB (Update Cache)
                    database.withTransaction {
                        dao.insertStats(statsEntity)
                        dao.clearRecentFiles()
                        dao.insertRecentFiles(fileEntities)
                    }
                    
                    // Emit New Data
                    send(Result.Success(DashboardData(statsEntity, fileEntities)))
                } else {
                    if (cachedStats == null) {
                        send(Result.Error(Exception(response.message ?: "Failed to fetch dashboard")))
                    }
                }
            } catch (e: Exception) {
                if (cachedStats == null) {
                    send(Result.Error(e))
                }
            }
        }
    }
}
