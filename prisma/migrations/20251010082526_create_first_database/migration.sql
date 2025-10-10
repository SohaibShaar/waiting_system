-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(20) NULL,
    `nationalId` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patients_nationalId_key`(`nationalId`),
    INDEX `patients_phoneNumber_idx`(`phoneNumber`),
    INDEX `patients_nationalId_idx`(`nationalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `displayNumber` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stations_displayNumber_key`(`displayNumber`),
    UNIQUE INDEX `stations_order_key`(`order`),
    INDEX `stations_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `queueNumber` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `currentStationId` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `queues_patientId_idx`(`patientId`),
    INDEX `queues_currentStationId_idx`(`currentStationId`),
    INDEX `queues_status_idx`(`status`),
    INDEX `queues_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `queues_queueNumber_createdAt_key`(`queueNumber`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queue_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `queueId` INTEGER NOT NULL,
    `stationId` INTEGER NOT NULL,
    `status` ENUM('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
    `calledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `calledBy` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `queue_history_queueId_idx`(`queueId`),
    INDEX `queue_history_stationId_idx`(`stationId`),
    INDEX `queue_history_status_idx`(`status`),
    INDEX `queue_history_calledAt_idx`(`calledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `completed_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `queueNumber` INTEGER NOT NULL,
    `totalDuration` INTEGER NULL,
    `waitingTime` INTEGER NULL,
    `serviceTime` INTEGER NULL,
    `stationsCount` INTEGER NOT NULL,
    `visitData` JSON NULL,
    `notes` TEXT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `completed_visits_patientId_idx`(`patientId`),
    INDEX `completed_visits_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `queues` ADD CONSTRAINT `queues_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queues` ADD CONSTRAINT `queues_currentStationId_fkey` FOREIGN KEY (`currentStationId`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queue_history` ADD CONSTRAINT `queue_history_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `queues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `queue_history` ADD CONSTRAINT `queue_history_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `completed_visits` ADD CONSTRAINT `completed_visits_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
