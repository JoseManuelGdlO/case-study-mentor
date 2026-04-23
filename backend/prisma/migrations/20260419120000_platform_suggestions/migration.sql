-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `platform_suggestion_prompt_handled_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `platform_suggestions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `source` ENUM('modal', 'mailbox') NOT NULL DEFAULT 'mailbox',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `platform_suggestions_user_id_idx`(`user_id`),
    INDEX `platform_suggestions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `platform_suggestions` ADD CONSTRAINT `platform_suggestions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
