-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `admin_email_notify_new_user` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `profiles` ADD COLUMN `admin_email_notify_new_subscription` BOOLEAN NOT NULL DEFAULT false;
