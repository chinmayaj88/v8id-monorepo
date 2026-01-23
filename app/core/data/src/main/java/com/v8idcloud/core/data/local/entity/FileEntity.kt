package com.v8idcloud.core.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "files",
    indices = [
        Index(value = ["parentId"]),
        Index(value = ["name"]) // For search performance
    ]
)
data class FileEntity(
    @PrimaryKey val id: String,
    val parentId: String?, // Null for root folder
    val name: String,
    val type: String, // "folder" or "file"
    val mimeType: String?,
    val size: Long,
    val thumbnailUrl: String?,
    val color: String?, // For folders
    val updatedAt: Long, // Timestamp
    val cachedAt: Long = System.currentTimeMillis() // For cache eviction logic
)
