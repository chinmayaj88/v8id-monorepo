package com.v8idcloud.core.data.di

import android.content.Context
import androidx.room.Room
import com.v8idcloud.core.data.local.V8idDatabase
import com.v8idcloud.core.data.local.dao.FileDao
import com.v8idcloud.core.data.local.security.DatabaseKeyManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SQLiteDatabase
import net.sqlcipher.database.SupportFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideV8idDatabase(
        @ApplicationContext context: Context,
        keyManager: DatabaseKeyManager
    ): V8idDatabase {
        // Initialize SQLCipher libraries
        System.loadLibrary("sqlcipher")
        
        val passphrase = keyManager.getDatabasePassphrase()
        val factory = SupportFactory(passphrase)

        return Room.databaseBuilder(
            context,
            V8idDatabase::class.java,
            "v8id_secure.db"
        )
            .openHelperFactory(factory)
            .fallbackToDestructiveMigration() // For development only
            .build()
    }

    @Provides
    fun provideFileDao(database: V8idDatabase): FileDao {
        return database.fileDao()
    }

    @Provides
    fun provideDashboardDao(database: V8idDatabase): com.v8idcloud.core.data.local.dao.DashboardDao {
        return database.dashboardDao()
    }
}
