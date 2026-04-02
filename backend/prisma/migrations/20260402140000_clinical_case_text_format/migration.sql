-- AlterTable
ALTER TABLE `clinical_cases` ADD COLUMN `text_format` ENUM('plain', 'html') NOT NULL DEFAULT 'plain';
