-- CreateTable
CREATE TABLE `integrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `auth_type` ENUM('API_KEY', 'TOKEN', 'OAUTH2', 'WEBHOOK', 'NONE') NOT NULL,
    `config_schema` JSON NOT NULL,
    `adapter_key` VARCHAR(191) NOT NULL DEFAULT 'generic',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `supports_connect` BOOLEAN NOT NULL DEFAULT true,
    `supports_enable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `integrations_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinic_integrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clinic_id` INTEGER NULL,
    `integration_id` INTEGER NOT NULL,
    `connection_status` ENUM('DISCONNECTED', 'CONNECTED', 'ERROR') NOT NULL DEFAULT 'DISCONNECTED',
    `is_enabled` BOOLEAN NOT NULL DEFAULT false,
    `encrypted_credentials` LONGTEXT NULL,
    `config` JSON NULL,
    `meta` JSON NULL,
    `connected_at` DATETIME(3) NULL,
    `disconnected_at` DATETIME(3) NULL,
    `last_health_check_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `clinic_integrations_integration_id_idx`(`integration_id`),
    UNIQUE INDEX `clinic_integrations_clinic_id_integration_id_key`(`clinic_id`, `integration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clinic_integrations` ADD CONSTRAINT `clinic_integrations_integration_id_fkey` FOREIGN KEY (`integration_id`) REFERENCES `integrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
