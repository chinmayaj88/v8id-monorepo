package com.v8idcloud.core.data.local.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import com.v8idcloud.core.common.security.CryptoManager
import dagger.hilt.android.qualifiers.ApplicationContext
import java.security.SecureRandom
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DatabaseKeyManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val cryptoManager: CryptoManager
) {

    companion object {
        private const val PREFS_NAME = "v8id_secure_prefs"
        private const val KEY_DB_PASSPHRASE = "db_passphrase_enc"
        private const val KEY_SIZE_BYTES = 32
    }

    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Returns the raw 32-byte passphrase for SQLCipher.
     * Generates and saves a new one if it doesn't exist.
     */
    fun getDatabasePassphrase(): ByteArray {
        val encryptedPassphrase = prefs.getString(KEY_DB_PASSPHRASE, null)

        return if (encryptedPassphrase == null) {
            generateAndSaveNewKey()
        } else {
            try {
                val decryptedString = cryptoManager.decrypt(encryptedPassphrase)
                if (decryptedString == null) {
                    // Critical Failure: KeyStore keys might have been wiped/invalidated
                    // We must generate a new key, meaning data loss (safety > crash)
                    // In a production app you might prompt the user to re-login/re-sync
                    generateAndSaveNewKey()
                } else {
                    Base64.decode(decryptedString, Base64.NO_WRAP)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                generateAndSaveNewKey()
            }
        }
    }

    private fun generateAndSaveNewKey(): ByteArray {
        val random = SecureRandom()
        val keyBytes = ByteArray(KEY_SIZE_BYTES)
        random.nextBytes(keyBytes)

        val keyString = Base64.encodeToString(keyBytes, Base64.NO_WRAP)
        val encryptedString = cryptoManager.encrypt(keyString)

        prefs.edit().putString(KEY_DB_PASSPHRASE, encryptedString).apply()

        return keyBytes
    }
}
