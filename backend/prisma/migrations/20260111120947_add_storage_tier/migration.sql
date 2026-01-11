-- AlterTable
ALTER TABLE `files` ADD COLUMN `storageTier` ENUM('STANDARD', 'ARCHIVE') NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX `files_storageTier_idx` ON `files`(`storageTier`);
