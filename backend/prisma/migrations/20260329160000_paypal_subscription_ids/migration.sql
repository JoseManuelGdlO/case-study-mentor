-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `paypal_subscription_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `profiles_paypal_subscription_id_key` ON `profiles`(`paypal_subscription_id`);

-- AlterTable
ALTER TABLE `subscription_plans` ADD COLUMN `paypal_plan_id` VARCHAR(191) NULL;
