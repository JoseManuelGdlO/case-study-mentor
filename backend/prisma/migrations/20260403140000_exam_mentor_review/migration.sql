-- AlterTable
ALTER TABLE `exams` ADD COLUMN `mentor_review_eligible` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mentor_review_rating` INTEGER NULL,
    ADD COLUMN `mentor_review_comment` TEXT NULL,
    ADD COLUMN `mentor_reviewed_at` DATETIME(3) NULL,
    ADD COLUMN `mentor_reviewed_by_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `exams_mentor_review_eligible_mentor_reviewed_at_idx` ON `exams`(`mentor_review_eligible`, `mentor_reviewed_at`);

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_mentor_reviewed_by_id_fkey` FOREIGN KEY (`mentor_reviewed_by_id`) REFERENCES `profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
