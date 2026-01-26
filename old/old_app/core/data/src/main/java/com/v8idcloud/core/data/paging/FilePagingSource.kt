package com.v8idcloud.core.data.paging

import androidx.paging.PagingSource
import androidx.paging.PagingState
import com.v8idcloud.core.data.network.FileApiService
import com.v8idcloud.core.data.network.SearchResultItemDto
import java.io.IOException

class FilePagingSource(
    private val apiService: FileApiService,
    private val folderId: String?
) : PagingSource<Int, SearchResultItemDto>() {

    override fun getRefreshKey(state: PagingState<Int, SearchResultItemDto>): Int? {
        return state.anchorPosition?.let { anchorPosition ->
            state.closestPageToPosition(anchorPosition)?.prevKey?.plus(1)
                ?: state.closestPageToPosition(anchorPosition)?.nextKey?.minus(1)
        }
    }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, SearchResultItemDto> {
        val page = params.key ?: 1
        return try {
            val response = apiService.getFiles(
                parentId = folderId,
                page = page,
                limit = params.loadSize
            )

            if (!response.success) {
                return LoadResult.Error(Exception(response.message ?: "Unknown API error"))
            }

            val items = response.data
            LoadResult.Page(
                data = items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (items.isEmpty() || items.size < params.loadSize) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}
