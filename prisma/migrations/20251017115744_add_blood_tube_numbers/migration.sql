/*
  Warnings:

  - You are about to alter the column `maleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `femaleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - A unique constraint covering the columns `[maleBloodTube1]` on the table `blood_draw_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[maleBloodTube2]` on the table `blood_draw_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[femaleBloodTube1]` on the table `blood_draw_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[femaleBloodTube2]` on the table `blood_draw_data` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `blood_draw_data` ADD COLUMN `femaleBloodTube1` VARCHAR(50) NULL,
    ADD COLUMN `femaleBloodTube2` VARCHAR(50) NULL,
    ADD COLUMN `maleBloodTube1` VARCHAR(50) NULL,
    ADD COLUMN `maleBloodTube2` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `reception_data` MODIFY `maleBirthDate` DATETIME NULL,
    MODIFY `femaleBirthDate` DATETIME NULL;

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_maleBloodTube1_key` ON `blood_draw_data`(`maleBloodTube1`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_maleBloodTube2_key` ON `blood_draw_data`(`maleBloodTube2`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_femaleBloodTube1_key` ON `blood_draw_data`(`femaleBloodTube1`);

-- CreateIndex
CREATE UNIQUE INDEX `blood_draw_data_femaleBloodTube2_key` ON `blood_draw_data`(`femaleBloodTube2`);
