/*
  Warnings:

  - You are about to alter the column `maleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `femaleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `reception_data` MODIFY `maleBirthDate` DATETIME NULL,
    MODIFY `femaleBirthDate` DATETIME NULL;

-- CreateTable
CREATE TABLE `blood_draw_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blood_draw_data_queueId_key`(`queueId`),
    INDEX `blood_draw_data_patientId_idx`(`patientId`),
    INDEX `blood_draw_data_queueId_idx`(`queueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blood_draw_data` ADD CONSTRAINT `blood_draw_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blood_draw_data` ADD CONSTRAINT `blood_draw_data_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
