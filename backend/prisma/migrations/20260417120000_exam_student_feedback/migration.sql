-- CreateEnum
CREATE TABLE `exam_student_feedback` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `exam_id` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_student_feedback_exam_id_key`(`exam_id`),
    INDEX `exam_student_feedback_user_id_idx`(`user_id`),
    INDEX `exam_student_feedback_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `exams` ADD COLUMN `student_feedback_eligible` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `exam_student_feedback` ADD CONSTRAINT `exam_student_feedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_student_feedback` ADD CONSTRAINT `exam_student_feedback_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
