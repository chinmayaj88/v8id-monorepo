-- AlterTable
ALTER TABLE `files` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `thumbnailGenerated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `thumbnailObjectName` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `file_shares` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `sharedWithId` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL DEFAULT 'READ',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `file_shares_ownerId_idx`(`ownerId`),
    INDEX `file_shares_sharedWithId_idx`(`sharedWithId`),
    INDEX `file_shares_fileId_idx`(`fileId`),
    INDEX `file_shares_folderId_idx`(`folderId`),
    UNIQUE INDEX `file_shares_fileId_sharedWithId_key`(`fileId`, `sharedWithId`),
    UNIQUE INDEX `file_shares_folderId_sharedWithId_key`(`folderId`, `sharedWithId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_versions` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `ociObjectName` VARCHAR(500) NOT NULL,
    `size` BIGINT NOT NULL,
    `hash` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_versions_ociObjectName_key`(`ociObjectName`),
    INDEX `file_versions_fileId_idx`(`fileId`),
    UNIQUE INDEX `file_versions_fileId_versionNumber_key`(`fileId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_favorites` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `file_favorites_userId_idx`(`userId`),
    INDEX `file_favorites_fileId_idx`(`fileId`),
    INDEX `file_favorites_folderId_idx`(`folderId`),
    UNIQUE INDEX `file_favorites_userId_fileId_key`(`userId`, `fileId`),
    UNIQUE INDEX `file_favorites_userId_folderId_key`(`userId`, `folderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_comments` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `file_comments_fileId_idx`(`fileId`),
    INDEX `file_comments_folderId_idx`(`folderId`),
    INDEX `file_comments_userId_idx`(`userId`),
    INDEX `file_comments_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_links` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `linkToken` VARCHAR(64) NOT NULL,
    `parUrl` VARCHAR(1000) NULL,
    `parId` VARCHAR(200) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `maxDownloads` INTEGER NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_links_linkToken_key`(`linkToken`),
    INDEX `file_links_userId_idx`(`userId`),
    INDEX `file_links_fileId_idx`(`fileId`),
    INDEX `file_links_folderId_idx`(`folderId`),
    INDEX `file_links_linkToken_idx`(`linkToken`),
    INDEX `file_links_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `folder_templates` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `structure` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `folder_templates_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_versions` ADD CONSTRAINT `file_versions_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_favorites` ADD CONSTRAINT `file_favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_favorites` ADD CONSTRAINT `file_favorites_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_favorites` ADD CONSTRAINT `file_favorites_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_comments` ADD CONSTRAINT `file_comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_comments` ADD CONSTRAINT `file_comments_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_comments` ADD CONSTRAINT `file_comments_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_links` ADD CONSTRAINT `file_links_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_links` ADD CONSTRAINT `file_links_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_links` ADD CONSTRAINT `file_links_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folder_templates` ADD CONSTRAINT `folder_templates_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
