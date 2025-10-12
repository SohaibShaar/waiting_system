/*
  Warnings:

  - You are about to alter the column `maleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `femaleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - A unique constraint covering the columns `[maleNationalId]` on the table `reception_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[femaleNationalId]` on the table `reception_data` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `reception_data` MODIFY `maleBirthDate` DATETIME NOT NULL,
    MODIFY `femaleBirthDate` DATETIME NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `reception_data_maleNationalId_key` ON `reception_data`(`maleNationalId`);

-- CreateIndex
CREATE UNIQUE INDEX `reception_data_femaleNationalId_key` ON `reception_data`(`femaleNationalId`);

-- CreateIndex
CREATE INDEX `reception_data_maleNationalId_idx` ON `reception_data`(`maleNationalId`);

-- CreateIndex
CREATE INDEX `reception_data_femaleNationalId_idx` ON `reception_data`(`femaleNationalId`);
