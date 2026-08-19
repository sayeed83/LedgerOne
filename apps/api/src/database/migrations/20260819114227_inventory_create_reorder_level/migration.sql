-- CreateTable
CREATE TABLE `reorder_levels` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `warehouse_uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `reorder_level` DECIMAL(18, 6) NOT NULL,
    `reorder_quantity` DECIMAL(18, 6) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `reorder_levels_uuid_key`(`uuid`),
    INDEX `idx_reorder_levels_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_reorder_levels_company_warehouse`(`company_uuid`, `warehouse_uuid`),
    INDEX `idx_reorder_levels_warehouse_product`(`warehouse_uuid`, `product_uuid`),
    INDEX `idx_reorder_levels_tenant_company_warehouse`(`tenant_id`, `company_uuid`, `warehouse_uuid`),
    UNIQUE INDEX `uq_reorder_levels_warehouse_product_deleted_at`(`warehouse_uuid`, `product_uuid`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
