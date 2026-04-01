-- CreateTable
CREATE TABLE `flashcards` (
  `id` VARCHAR(191) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `hint` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flashcard_specialties` (
  `flashcard_id` VARCHAR(191) NOT NULL,
  `specialty_id` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`flashcard_id`, `specialty_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flashcard_areas` (
  `flashcard_id` VARCHAR(191) NOT NULL,
  `area_id` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`flashcard_id`, `area_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_plans` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed', 'skipped') NOT NULL DEFAULT 'pending',
  `is_free_limited` BOOLEAN NOT NULL DEFAULT false,
  `target_minutes` INTEGER NOT NULL DEFAULT 30,
  `estimated_score_delta` DOUBLE NOT NULL DEFAULT 0,
  `estimated_percentile_delta` DOUBLE NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_plan_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `study_plan_id` VARCHAR(191) NOT NULL,
  `task_type` ENUM('question_set', 'flashcard_set', 'mini_case') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `target_count` INTEGER NOT NULL DEFAULT 0,
  `completed_count` INTEGER NOT NULL DEFAULT 0,
  `payload` JSON NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_plan_executions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `study_plan_id` VARCHAR(191) NOT NULL,
  `study_plan_task_id` VARCHAR(191) NOT NULL,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `score` DOUBLE NULL,
  `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `study_plans_user_id_status_idx` ON `study_plans`(`user_id`, `status`);
CREATE UNIQUE INDEX `study_plans_user_id_date_key` ON `study_plans`(`user_id`, `date`);
CREATE INDEX `study_plan_tasks_study_plan_id_task_type_idx` ON `study_plan_tasks`(`study_plan_id`, `task_type`);
CREATE INDEX `study_plan_executions_user_id_completed_at_idx` ON `study_plan_executions`(`user_id`, `completed_at`);
CREATE UNIQUE INDEX `sp_exec_user_plan_task_uq`
ON `study_plan_executions`(`user_id`, `study_plan_id`, `study_plan_task_id`);

-- AddForeignKey
ALTER TABLE `flashcard_specialties`
  ADD CONSTRAINT `flashcard_specialties_flashcard_id_fkey`
  FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `flashcard_specialties`
  ADD CONSTRAINT `flashcard_specialties_specialty_id_fkey`
  FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `flashcard_areas`
  ADD CONSTRAINT `flashcard_areas_flashcard_id_fkey`
  FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `flashcard_areas`
  ADD CONSTRAINT `flashcard_areas_area_id_fkey`
  FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `study_plans`
  ADD CONSTRAINT `study_plans_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `study_plan_tasks`
  ADD CONSTRAINT `study_plan_tasks_study_plan_id_fkey`
  FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `study_plan_executions`
  ADD CONSTRAINT `study_plan_executions_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `study_plan_executions`
  ADD CONSTRAINT `study_plan_executions_study_plan_id_fkey`
  FOREIGN KEY (`study_plan_id`) REFERENCES `study_plans`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `study_plan_executions`
  ADD CONSTRAINT `study_plan_executions_study_plan_task_id_fkey`
  FOREIGN KEY (`study_plan_task_id`) REFERENCES `study_plan_tasks`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
