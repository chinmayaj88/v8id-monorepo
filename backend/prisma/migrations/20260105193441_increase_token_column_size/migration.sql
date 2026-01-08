-- AlterTable
-- Increase accessToken and refreshToken column size to accommodate JWT tokens
ALTER TABLE `device_sessions` MODIFY `accessToken` VARCHAR(500) NOT NULL;
ALTER TABLE `device_sessions` MODIFY `refreshToken` VARCHAR(500) NOT NULL;
