-- AlterTable
ALTER TABLE `questions` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `questions_case_id_deleted_at_idx` ON `questions`(`case_id`, `deleted_at`);
