package com.v8idcloud.core.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.v8idcloud.core.data.local.entity.RemoteKeyEntity

@Dao
interface RemoteKeyDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(remoteKey: RemoteKeyEntity)

    @Query("SELECT * FROM remote_keys WHERE folderId = :folderId")
    suspend fun getRemoteKey(folderId: String): RemoteKeyEntity?

    @Query("DELETE FROM remote_keys WHERE folderId = :folderId")
    suspend fun clearRemoteKey(folderId: String)
}
