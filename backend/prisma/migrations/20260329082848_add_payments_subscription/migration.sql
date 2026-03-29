-- AlterTable
ALTER TABLE `motivational_phrases` MODIFY `text` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `stripe_customer_id` VARCHAR(191) NULL,
    ADD COLUMN `subscription_expires_at` DATETIME(3) NULL,
    ADD COLUMN `subscription_tier` ENUM('free', 'monthly', 'semester', 'annual') NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `provider` ENUM('stripe', 'paypal') NOT NULL,
    `external_id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'mxn',
    `status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
    `tier` ENUM('free', 'monthly', 'semester', 'annual') NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_provider_external_id_key`(`provider`, `external_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
