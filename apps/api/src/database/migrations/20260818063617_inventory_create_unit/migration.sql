-- CreateTable
CREATE TABLE `units` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `base_unit_id` BIGINT UNSIGNED NULL,
    `conversion_factor` DECIMAL(20, 10) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `units_uuid_key`(`uuid`),
    INDEX `idx_units_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_units_company_uuid`(`company_uuid`),
    UNIQUE INDEX `uq_units_tenant_company_name_deleted_at`(`tenant_id`, `company_uuid`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_base_unit_id_fkey` FOREIGN KEY (`base_unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
