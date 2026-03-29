-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `auth_provider` ENUM('email', 'google') NOT NULL DEFAULT 'email';
