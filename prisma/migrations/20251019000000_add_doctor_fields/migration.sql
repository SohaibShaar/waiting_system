-- AlterTable
ALTER TABLE `doctor_data` ADD COLUMN `maleHIVvalue` VARCHAR(255) NULL,
    ADD COLUMN `femaleHIVvalue` VARCHAR(255) NULL,
    ADD COLUMN `maleHBSvalue` VARCHAR(255) NULL,
    ADD COLUMN `femaleHBSvalue` VARCHAR(255) NULL,
    ADD COLUMN `maleHBCvalue` VARCHAR(255) NULL,
    ADD COLUMN `femaleHBCvalue` VARCHAR(255) NULL,
    ADD COLUMN `maleHemoglobinEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maleHbS` VARCHAR(255) NULL,
    ADD COLUMN `maleHbF` VARCHAR(255) NULL,
    ADD COLUMN `maleHbA1c` VARCHAR(255) NULL,
    ADD COLUMN `maleHbA2` VARCHAR(255) NULL,
    ADD COLUMN `maleHbSc` VARCHAR(255) NULL,
    ADD COLUMN `maleHbD` VARCHAR(255) NULL,
    ADD COLUMN `maleHbE` VARCHAR(255) NULL,
    ADD COLUMN `maleHbC` VARCHAR(255) NULL,
    ADD COLUMN `femaleHemoglobinEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `femaleHbS` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbF` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbA1c` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbA2` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbSc` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbD` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbE` VARCHAR(255) NULL,
    ADD COLUMN `femaleHbC` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `completed_patient_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `queueId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `receptionData` LONGTEXT NULL,
    `accountingData` LONGTEXT NULL,
    `bloodDrawData` LONGTEXT NULL,
    `labData` LONGTEXT NULL,
    `doctorData` LONGTEXT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `completed_patient_data_queueId_key`(`queueId`),
    INDEX `completed_patient_data_patientId_idx`(`patientId`),
    INDEX `completed_patient_data_queueId_idx`(`queueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `completed_patient_data` ADD CONSTRAINT `completed_patient_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

