-- AlterTable
ALTER TABLE `questions` ADD COLUMN `difficulty_level` INTEGER NOT NULL DEFAULT 2;

-- Migrate legacy string difficulty to 1/2/3
UPDATE `questions` SET `difficulty_level` = CASE `difficulty`
  WHEN 'low' THEN 1
  WHEN 'high' THEN 3
  ELSE 2
END;

ALTER TABLE `questions` DROP COLUMN `difficulty`;

ALTER TABLE `questions` ADD COLUMN `cognitive_competence` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `questions` ADD COLUMN `previous_enarm_presence` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `questions` ADD COLUMN `hint` TEXT NOT NULL DEFAULT ('');
