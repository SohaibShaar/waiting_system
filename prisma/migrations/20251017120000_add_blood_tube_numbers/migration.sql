-- AlterTable
ALTER TABLE `blood_draw_data` ADD COLUMN `maleBloodTube1` VARCHAR(50) NULL,
    ADD COLUMN `maleBloodTube2` VARCHAR(50) NULL,
    ADD COLUMN `femaleBloodTube1` VARCHAR(50) NULL,
    ADD COLUMN `femaleBloodTube2` VARCHAR(50) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_maleBloodTube1_key` ON `blood_draw_data`(`maleBloodTube1`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_maleBloodTube2_key` ON `blood_draw_data`(`maleBloodTube2`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_femaleBloodTube1_key` ON `blood_draw_data`(`femaleBloodTube1`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_femaleBloodTube2_key` ON `blood_draw_data`(`femaleBloodTube2`);

