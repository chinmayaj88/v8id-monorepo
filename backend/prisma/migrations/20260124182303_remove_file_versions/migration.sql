/*
  Warnings:

  - You are about to drop the `file_versions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `file_versions` DROP FOREIGN KEY `file_versions_fileId_fkey`;

-- DropTable
DROP TABLE `file_versions`;
