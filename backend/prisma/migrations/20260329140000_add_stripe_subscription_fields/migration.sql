-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `stripe_subscription_id` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `subscription_cancel_at_period_end` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `profiles_stripe_subscription_id_key` ON `profiles`(`stripe_subscription_id`);
