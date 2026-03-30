-- CreateTable
CREATE TABLE `subscription_cancellation_feedback` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `provider` ENUM('stripe', 'paypal') NOT NULL,
    `reason` ENUM('too_expensive', 'not_using_enough', 'exam_finished_or_paused', 'found_alternative', 'technical_issues', 'content_not_expected', 'prefer_not_to_say', 'other') NOT NULL,
    `details` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_cancellation_feedback_user_id_idx`(`user_id`),
    INDEX `subscription_cancellation_feedback_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_cancellation_feedback` ADD CONSTRAINT `subscription_cancellation_feedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
