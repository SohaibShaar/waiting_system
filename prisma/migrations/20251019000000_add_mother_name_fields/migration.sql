-- AlterTable
ALTER TABLE `reception_data` ADD COLUMN `maleMotherName` VARCHAR(255) NULL AFTER `maleFatherName`,
    ADD COLUMN `femaleMotherName` VARCHAR(255) NULL AFTER `femaleFatherName`;

