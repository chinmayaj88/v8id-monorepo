package com.v8idcloud.core.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

import com.v8idcloud.core.data.local.entity.DashboardStatsEntity
import com.v8idcloud.core.data.local.entity.RecentFileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DashboardDao {
    
    // --- Stats ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStats(stats: DashboardStatsEntity)

    @Query("SELECT * FROM dashboard_stats WHERE id = 0")
    fun getStats(): Flow<DashboardStatsEntity?>

    @Query("SELECT * FROM dashboard_stats WHERE id = 0")
    suspend fun getStatsSync(): DashboardStatsEntity?

    // --- Recent Files ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecentFiles(files: List<RecentFileEntity>)

    @Query("DELETE FROM recent_files")
    suspend fun clearRecentFiles()

    @Query("SELECT * FROM recent_files ORDER BY updatedAt DESC")
    fun getRecentFiles(): Flow<List<RecentFileEntity>>
    
    @Query("SELECT * FROM recent_files ORDER BY updatedAt DESC")
    suspend fun getRecentFilesSync(): List<RecentFileEntity>
    
    @Query("SELECT * FROM recent_files WHERE type = :type ORDER BY updatedAt DESC")
    fun getRecentFilesByType(type: String): Flow<List<RecentFileEntity>>
}
