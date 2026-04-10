CREATE TABLE `body_charts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `patient_id` INTEGER NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `image_url` VARCHAR(191) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `body_charts_patient_id_idx`(`patient_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `body_charts`
  ADD CONSTRAINT `body_charts_patient_id_fkey`
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
