-- AlterTable
-- Add tokenVersion to users table for token invalidation on password change
ALTER TABLE `users` ADD COLUMN `tokenVersion` INT NOT NULL DEFAULT 0;

-- CreateTable
-- Create audit_logs table for security event logging
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventData` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_eventType_idx`(`eventType`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_success_idx`(`success`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
