-- AlterTable
ALTER TABLE `exams`
  ADD COLUMN `adaptive_mode` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `prediction_specialty` VARCHAR(191) NULL,
  ADD COLUMN `prediction_version` VARCHAR(191) NULL,
  ADD COLUMN `predicted_percentile` DOUBLE NULL,
  ADD COLUMN `predicted_placement_probability` DOUBLE NULL;

-- AlterTable
ALTER TABLE `user_answers`
  ADD COLUMN `response_time_seconds` INTEGER NULL,
  ADD COLUMN `question_difficulty` INTEGER NULL;

-- CreateTable
CREATE TABLE `prediction_calibrations` (
  `id` VARCHAR(191) NOT NULL,
  `specialty_id` VARCHAR(191) NOT NULL,
  `version` VARCHAR(191) NOT NULL DEFAULT 'v1',
  `min_score` DOUBLE NOT NULL,
  `max_score` DOUBLE NOT NULL,
  `percentile_estimate` DOUBLE NOT NULL,
  `probability_estimate` DOUBLE NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `prediction_calibrations_specialty_id_version_idx` ON `prediction_calibrations`(`specialty_id`, `version`);

-- CreateIndex
CREATE INDEX `prediction_calibrations_specialty_id_min_score_max_score_idx` ON `prediction_calibrations`(`specialty_id`, `min_score`, `max_score`);

-- AddForeignKey
ALTER TABLE `prediction_calibrations`
  ADD CONSTRAINT `prediction_calibrations_specialty_id_fkey`
  FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
