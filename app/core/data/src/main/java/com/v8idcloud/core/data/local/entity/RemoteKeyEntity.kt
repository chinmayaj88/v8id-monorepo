package com.v8idcloud.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "remote_keys")
data class RemoteKeyEntity(
    @PrimaryKey val folderId: String, // "root" or actual ID
    val nextPage: Int?,
    val lastUpdated: Long = System.currentTimeMillis()
)
