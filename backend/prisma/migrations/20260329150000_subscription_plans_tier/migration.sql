-- AlterTable
ALTER TABLE `subscription_plans` ADD COLUMN `tier` ENUM('free', 'monthly', 'semester', 'annual') NULL;

-- CreateIndex
CREATE INDEX `subscription_plans_tier_idx` ON `subscription_plans`(`tier`);
