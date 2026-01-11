/*
  Warnings:

  - A unique constraint covering the columns `[uploadSessionId]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `files` ADD COLUMN `uploadSessionId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `upload_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(500) NOT NULL,
    `fileSize` BIGINT NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `chunkSize` INTEGER NOT NULL DEFAULT 5242880,
    `totalChunks` INTEGER NOT NULL,
    `uploadedChunks` INTEGER NOT NULL DEFAULT 0,
    `uploadedBytes` BIGINT NOT NULL DEFAULT 0,
    `uploadMethod` VARCHAR(191) NOT NULL,
    `parUrl` VARCHAR(1000) NULL,
    `parId` VARCHAR(200) NULL,
    `ociObjectName` VARCHAR(500) NULL,
    `hash` VARCHAR(64) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `upload_sessions_userId_idx`(`userId`),
    INDEX `upload_sessions_isCompleted_idx`(`isCompleted`),
    INDEX `upload_sessions_expiresAt_idx`(`expiresAt`),
    INDEX `upload_sessions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `files_uploadSessionId_key` ON `files`(`uploadSessionId`);

-- AddForeignKey
ALTER TABLE `upload_sessions` ADD CONSTRAINT `upload_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_sessions` ADD CONSTRAINT `upload_sessions_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_uploadSessionId_fkey` FOREIGN KEY (`uploadSessionId`) REFERENCES `upload_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
