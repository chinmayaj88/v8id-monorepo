package com.v8idcloud.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dashboard_stats")
data class DashboardStatsEntity(
    @PrimaryKey val id: Int = 0, // Singleton row
    val storageUsed: Long,
    val storageTotal: Long,
    val storagePercentage: Double,
    val totalFiles: Int,
    val totalFolders: Int,
    val lastUpdated: Long = System.currentTimeMillis()
)
