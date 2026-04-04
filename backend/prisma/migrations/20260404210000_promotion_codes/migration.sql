-- CreateTable
CREATE TABLE `promotion_codes` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `percent_off` INTEGER NOT NULL,
    `max_redemptions` INTEGER NULL,
    `valid_from` DATETIME(3) NULL,
    `valid_until` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `stripe_coupon_id` VARCHAR(191) NOT NULL,
    `stripe_promotion_code_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promotion_codes_code_key`(`code`),
    UNIQUE INDEX `promotion_codes_stripe_promotion_code_id_key`(`stripe_promotion_code_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
