-- CreateTable
CREATE TABLE `folders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `path` TEXT NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `folders_userId_idx`(`userId`),
    INDEX `folders_parentId_idx`(`parentId`),
    INDEX `folders_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `storageTier` ENUM('STANDARD', 'ARCHIVE') NOT NULL DEFAULT 'STANDARD',
    `size` BIGINT NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `extension` VARCHAR(191) NULL,
    `thumbnailKey` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `isOfflineAvailable` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `files_userId_idx`(`userId`),
    INDEX `files_folderId_idx`(`folderId`),
    INDEX `files_storageTier_idx`(`storageTier`),
    INDEX `files_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_shares` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `sharedWith` VARCHAR(191) NULL,
    `token` VARCHAR(191) NULL,
    `permission` ENUM('VIEW', 'EDIT') NOT NULL DEFAULT 'VIEW',
    `type` ENUM('INTERNAL', 'PUBLIC_LINK') NOT NULL DEFAULT 'INTERNAL',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_shares_token_key`(`token`),
    INDEX `file_shares_fileId_idx`(`fileId`),
    INDEX `file_shares_ownerId_idx`(`ownerId`),
    INDEX `file_shares_token_idx`(`token`),
    INDEX `file_shares_sharedWith_idx`(`sharedWith`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `folder_shares` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `sharedWith` VARCHAR(191) NULL,
    `token` VARCHAR(191) NULL,
    `permission` ENUM('VIEW', 'EDIT') NOT NULL DEFAULT 'VIEW',
    `type` ENUM('INTERNAL', 'PUBLIC_LINK') NOT NULL DEFAULT 'INTERNAL',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `folder_shares_token_key`(`token`),
    INDEX `folder_shares_folderId_idx`(`folderId`),
    INDEX `folder_shares_ownerId_idx`(`ownerId`),
    INDEX `folder_shares_token_idx`(`token`),
    INDEX `folder_shares_sharedWith_idx`(`sharedWith`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folder_shares` ADD CONSTRAINT `folder_shares_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folder_shares` ADD CONSTRAINT `folder_shares_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
