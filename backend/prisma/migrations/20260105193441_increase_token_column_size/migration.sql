-- AlterTable
-- Increase accessToken and refreshToken column size to accommodate JWT tokens (typically 200-500 chars)
ALTER TABLE `device_sessions` 
  MODIFY `accessToken` VARCHAR(500) NOT NULL,
  MODIFY `refreshToken` VARCHAR(500) NOT NULL;
