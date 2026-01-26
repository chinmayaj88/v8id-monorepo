package com.v8idcloud.core.data.repository

import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.network.SearchResultItemDto
import com.v8idcloud.core.data.paging.FilePagingSource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

interface FileRepository {
    fun getFilesStream(folderId: String?): Flow<PagingData<SearchResultItemDto>>
}

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
}
