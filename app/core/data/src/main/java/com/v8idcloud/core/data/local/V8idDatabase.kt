package com.v8idcloud.core.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.v8idcloud.core.data.local.dao.FileDao
import com.v8idcloud.core.data.local.entity.FileEntity
import com.v8idcloud.core.data.local.dao.RemoteKeyDao
import com.v8idcloud.core.data.local.entity.RemoteKeyEntity

import com.v8idcloud.core.data.local.dao.DashboardDao
import com.v8idcloud.core.data.local.entity.DashboardStatsEntity
import com.v8idcloud.core.data.local.entity.RecentFileEntity

@Database(
    entities = [
        FileEntity::class, 
        RemoteKeyEntity::class,
        RecentFileEntity::class,
        DashboardStatsEntity::class
    ],
    version = 2, // Incremented version
    exportSchema = false
)
abstract class V8idDatabase : RoomDatabase() {
    abstract fun fileDao(): FileDao
    abstract fun remoteKeyDao(): RemoteKeyDao
    abstract fun dashboardDao(): DashboardDao
}
