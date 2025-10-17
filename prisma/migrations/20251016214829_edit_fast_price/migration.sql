/*
  Warnings:

  - You are about to drop the column `fastAddValue` on the `favoriteprice` table. All the data in the column will be lost.
  - You are about to alter the column `maleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `femaleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `favoriteprice` DROP COLUMN `fastAddValue`;

-- AlterTable
ALTER TABLE `reception_data` MODIFY `maleBirthDate` DATETIME NULL,
    MODIFY `femaleBirthDate` DATETIME NULL;

-- CreateTable
CREATE TABLE `FastAddValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
