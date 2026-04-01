-- AlterTable
UPDATE `questions` SET `hint` = '' WHERE `hint` IS NULL;
ALTER TABLE `questions` MODIFY `hint` TEXT NOT NULL;
