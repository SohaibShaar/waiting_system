/*
  Warnings:

  - You are about to alter the column `maleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `femaleBirthDate` on the `reception_data` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- DropIndex
DROP INDEX `reception_data_femaleNationalId_key` ON `reception_data`;

-- DropIndex
DROP INDEX `reception_data_maleNationalId_key` ON `reception_data`;

-- AlterTable
ALTER TABLE `reception_data` MODIFY `maleBirthDate` DATETIME NULL,
    MODIFY `femaleBirthDate` DATETIME NULL;
