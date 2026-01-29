-- CreateTable
CREATE TABLE `vault_secrets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `encryptedPassword` TEXT NOT NULL,
    `iv` VARCHAR(191) NOT NULL,
    `authTag` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vault_secrets_userId_idx`(`userId`),
    INDEX `vault_secrets_url_idx`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vault_secrets` ADD CONSTRAINT `vault_secrets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
