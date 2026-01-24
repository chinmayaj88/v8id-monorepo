package com.v8idcloud.core.data.local.dao

import androidx.paging.PagingSource
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.v8idcloud.core.data.local.entity.FileEntity

@Dao
interface FileDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(files: List<FileEntity>)

    /**
     * Get files in a specific folder.
     * If folderId is null (Root), custom logic might be needed or we pass a specific "root" ID.
     * We'll assume root has parentId == "root" or null.
     */
    @Query("SELECT * FROM files WHERE (:parentId IS NULL AND parentId IS NULL) OR (parentId = :parentId) ORDER BY type DESC, name ASC")
    fun getFilesByParent(parentId: String?): PagingSource<Int, FileEntity>

    @Query("DELETE FROM files WHERE (:parentId IS NULL AND parentId IS NULL) OR (parentId = :parentId)")
    suspend fun clearFilesByParent(parentId: String?)
    
    @Query("DELETE FROM files")
    suspend fun clearAll()
}
