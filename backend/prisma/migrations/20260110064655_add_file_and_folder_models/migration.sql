-- CreateTable
CREATE TABLE `folders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(7) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `folders_userId_idx`(`userId`),
    INDEX `folders_parentId_idx`(`parentId`),
    INDEX `folders_isDeleted_idx`(`isDeleted`),
    INDEX `folders_userId_parentId_name_idx`(`userId`, `parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` BIGINT NOT NULL,
    `type` ENUM('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'ARCHIVE', 'OTHER') NOT NULL,
    `status` ENUM('UPLOADING', 'ACTIVE', 'DELETED', 'ARCHIVED') NOT NULL DEFAULT 'UPLOADING',
    `ociObjectName` VARCHAR(500) NOT NULL,
    `hash` VARCHAR(64) NOT NULL,
    `description` TEXT NULL,
    `tags` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `files_ociObjectName_key`(`ociObjectName`),
    INDEX `files_userId_idx`(`userId`),
    INDEX `files_folderId_idx`(`folderId`),
    INDEX `files_status_idx`(`status`),
    INDEX `files_type_idx`(`type`),
    INDEX `files_hash_idx`(`hash`),
    INDEX `files_userId_folderId_name_idx`(`userId`, `folderId`, `name`),
    INDEX `files_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
