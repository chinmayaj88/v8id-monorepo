-- CreateIndex
CREATE INDEX `files_expiresAt_idx` ON `files`(`expiresAt`);

-- CreateIndex
CREATE INDEX `files_deletedAt_idx` ON `files`(`deletedAt`);
