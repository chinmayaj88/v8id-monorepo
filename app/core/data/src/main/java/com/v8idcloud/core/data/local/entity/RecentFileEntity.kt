package com.v8idcloud.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "recent_files")
data class RecentFileEntity(
    @PrimaryKey val id: String,
    val parentId: String?,
    val name: String,
    val type: String,
    val mimeType: String?,
    val size: Long,
    val thumbnailUrl: String?,
    val color: String?,
    val updatedAt: Long
)
