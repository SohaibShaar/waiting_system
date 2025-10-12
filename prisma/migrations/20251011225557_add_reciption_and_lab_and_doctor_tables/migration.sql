-- CreateTable
CREATE TABLE `reception_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueId` INTEGER NOT NULL,
    `maleName` VARCHAR(255) NOT NULL,
    `maleLastName` VARCHAR(255) NOT NULL,
    `maleFatherName` VARCHAR(255) NOT NULL,
    `maleBirthDate` DATETIME NOT NULL,
    `maleNationalId` VARCHAR(255) NOT NULL,
    `maleAge` INTEGER NOT NULL DEFAULT 0,
    `femaleName` VARCHAR(255) NOT NULL,
    `femaleLastName` VARCHAR(255) NOT NULL,
    `femaleFatherName` VARCHAR(255) NOT NULL,
    `femaleBirthDate` DATETIME NOT NULL,
    `femaleNationalId` VARCHAR(255) NOT NULL,
    `femaleAge` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reception_data_queueId_key`(`queueId`),
    INDEX `reception_data_patientId_idx`(`patientId`),
    INDEX `reception_data_queueId_idx`(`queueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounting_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NULL DEFAULT 0,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounting_data_queueId_key`(`queueId`),
    INDEX `accounting_data_patientId_idx`(`patientId`),
    INDEX `accounting_data_queueId_idx`(`queueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueId` INTEGER NOT NULL,
    `doctorName` VARCHAR(255) NULL,
    `isMaleHealthy` ENUM('HEALTHY', 'UNHEALTHY') NOT NULL DEFAULT 'HEALTHY',
    `isFemaleHealthy` ENUM('HEALTHY', 'UNHEALTHY') NOT NULL DEFAULT 'HEALTHY',
    `maleNotes` TEXT NULL,
    `femaleNotes` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lab_data_queueId_key`(`queueId`),
    INDEX `lab_data_patientId_idx`(`patientId`),
    INDEX `lab_data_queueId_idx`(`queueId`),
    INDEX `lab_data_doctorName_idx`(`doctorName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueId` INTEGER NOT NULL,
    `maleBloodType` VARCHAR(255) NULL,
    `femaleBloodType` VARCHAR(255) NULL,
    `maleHIVstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `femaleHIVstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `maleHBSstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `femaleHBSstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `maleHBCstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `femaleHBCstatus` ENUM('POSITIVE', 'NEGATIVE') NOT NULL DEFAULT 'NEGATIVE',
    `maleNotes` TEXT NULL,
    `femaleNotes` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_data_queueId_key`(`queueId`),
    INDEX `doctor_data_patientId_idx`(`patientId`),
    INDEX `doctor_data_queueId_idx`(`queueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reception_data` ADD CONSTRAINT `reception_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reception_data` ADD CONSTRAINT `reception_data_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounting_data` ADD CONSTRAINT `accounting_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounting_data` ADD CONSTRAINT `accounting_data_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_data` ADD CONSTRAINT `lab_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_data` ADD CONSTRAINT `lab_data_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_data` ADD CONSTRAINT `doctor_data_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_data` ADD CONSTRAINT `doctor_data_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
