-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `admin_push_notify_new_user` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `profiles` ADD COLUMN `admin_push_notify_new_subscription` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable (sin UNIQUE sobre endpoint largo: límite InnoDB ~3072 bytes con utf8mb4)
CREATE TABLE `admin_web_push_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `endpoint` TEXT NOT NULL,
    `endpoint_hash` VARCHAR(64) NOT NULL,
    `p256dh` VARCHAR(512) NOT NULL,
    `auth` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_web_push_subscriptions_endpoint_hash_key`(`endpoint_hash`),
    INDEX `admin_web_push_subscriptions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_web_push_subscriptions` ADD CONSTRAINT `admin_web_push_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
