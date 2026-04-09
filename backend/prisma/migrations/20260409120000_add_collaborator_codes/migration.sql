-- CreateTable
CREATE TABLE `collaborator_codes` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `promotion_code_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `collaborator_codes_code_key`(`code`),
    UNIQUE INDEX `collaborator_codes_promotion_code_id_key`(`promotion_code_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `collaborator_codes` ADD CONSTRAINT `collaborator_codes_promotion_code_id_fkey` FOREIGN KEY (`promotion_code_id`) REFERENCES `promotion_codes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `collaborator_code_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `profiles_collaborator_code_id_idx` ON `profiles`(`collaborator_code_id`);

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_collaborator_code_id_fkey` FOREIGN KEY (`collaborator_code_id`) REFERENCES `collaborator_codes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
