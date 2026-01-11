-- AlterTable
ALTER TABLE `upload_sessions` ADD COLUMN `storageTier` ENUM('STANDARD', 'ARCHIVE') NOT NULL DEFAULT 'STANDARD';
