-- AlterTable
ALTER TABLE `clinical_cases`
  ADD COLUMN `created_by_id` VARCHAR(191) NULL,
  ADD COLUMN `updated_by_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `clinical_cases`
  ADD CONSTRAINT `clinical_cases_created_by_id_fkey`
  FOREIGN KEY (`created_by_id`) REFERENCES `profiles`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clinical_cases`
  ADD CONSTRAINT `clinical_cases_updated_by_id_fkey`
  FOREIGN KEY (`updated_by_id`) REFERENCES `profiles`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `clinical_cases_created_by_id_idx` ON `clinical_cases`(`created_by_id`);

-- CreateIndex
CREATE INDEX `clinical_cases_updated_by_id_idx` ON `clinical_cases`(`updated_by_id`);
