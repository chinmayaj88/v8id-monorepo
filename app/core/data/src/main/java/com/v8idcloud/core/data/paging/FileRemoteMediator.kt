package com.v8idcloud.core.data.paging

import androidx.paging.ExperimentalPagingApi
import androidx.paging.LoadType
import androidx.paging.PagingState
import androidx.paging.RemoteMediator
import androidx.room.withTransaction
import com.v8idcloud.core.data.local.V8idDatabase
import com.v8idcloud.core.data.local.entity.FileEntity
import com.v8idcloud.core.data.local.entity.RemoteKeyEntity
import com.v8idcloud.core.data.network.FileApiService
import retrofit2.HttpException
import java.io.IOException

@OptIn(ExperimentalPagingApi::class)
class FileRemoteMediator(
    private val folderId: String?, // Null for root
    private val apiService: FileApiService,
    private val database: V8idDatabase
) : RemoteMediator<Int, FileEntity>() {

    private val effectiveFolderId = folderId ?: "root"

    override suspend fun initialize(): InitializeAction {
        // Cached data is valid for 1 hour, otherwise refresh
        val remoteKey = database.remoteKeyDao().getRemoteKey(effectiveFolderId)
        val cacheTimeout = 60 * 60 * 1000L // 1 hour
        
        return if (remoteKey != null && 
            (System.currentTimeMillis() - remoteKey.lastUpdated < cacheTimeout)) {
            InitializeAction.SKIP_INITIAL_REFRESH
        } else {
            InitializeAction.LAUNCH_INITIAL_REFRESH
        }
    }

    override suspend fun load(
        loadType: LoadType,
        state: PagingState<Int, FileEntity>
    ): MediatorResult {
        return try {
            val page = when (loadType) {
                LoadType.REFRESH -> 1
                LoadType.PREPEND -> return MediatorResult.Success(endOfPaginationReached = true)
                LoadType.APPEND -> {
                    val remoteKey = database.remoteKeyDao().getRemoteKey(effectiveFolderId)
                    val nextPage = remoteKey?.nextPage
                    
                    if (nextPage == null) {
                        return MediatorResult.Success(endOfPaginationReached = true)
                    }
                    nextPage
                }
            }

            val apiResponse = apiService.getFiles(
                parentId = folderId,
                page = page,
                limit = state.config.pageSize
            )

            if (!apiResponse.success) {
                return MediatorResult.Error(Exception(apiResponse.message ?: "Unknown API error"))
            }

            val items = apiResponse.data
            val endOfPaginationReached = items.isEmpty() || items.size < state.config.pageSize

            database.withTransaction {
                if (loadType == LoadType.REFRESH) {
                    database.remoteKeyDao().clearRemoteKey(effectiveFolderId)
                    database.fileDao().clearFilesByParent(folderId)
                }

                val nextPage = if (endOfPaginationReached) null else page + 1
                
                database.remoteKeyDao().insert(
                    RemoteKeyEntity(
                        folderId = effectiveFolderId,
                        nextPage = nextPage
                    )
                )

                val entities = items.map { dto ->
                    FileEntity(
                        id = dto.id,
                        parentId = folderId,
                        name = dto.name,
                        type = dto.type,
                        mimeType = dto.mimeType,
                        size = dto.size ?: 0L,
                        thumbnailUrl = dto.thumbnailUrl,
                        color = dto.color,
                        updatedAt = System.currentTimeMillis() // Or parse dto.updatedAt
                    )
                }
                database.fileDao().insertAll(entities)
            }

            MediatorResult.Success(endOfPaginationReached = endOfPaginationReached)

        } catch (e: IOException) {
            MediatorResult.Error(e)
        } catch (e: HttpException) {
            MediatorResult.Error(e)
        }
    }
}
