-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `onboarding_welcome_exam_created_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `exams` ADD COLUMN `is_onboarding_welcome` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `exams` ADD COLUMN `welcome_lead_in_first_name` VARCHAR(255) NULL;
ALTER TABLE `exams` ADD COLUMN `welcome_lead_in_university` VARCHAR(512) NULL;
