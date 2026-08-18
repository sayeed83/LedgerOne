-- CreateTable
CREATE TABLE `stocks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `warehouse_uuid` CHAR(36) NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity_on_hand` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `quantity_reserved` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `quantity_available` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `stocks_uuid_key`(`uuid`),
    INDEX `idx_stocks_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_stocks_company_warehouse`(`company_uuid`, `warehouse_uuid`),
    INDEX `idx_stocks_warehouse_product`(`warehouse_uuid`, `product_id`),
    INDEX `idx_stocks_tenant_company_warehouse`(`tenant_id`, `company_uuid`, `warehouse_uuid`),
    UNIQUE INDEX `uq_stocks_warehouse_product_deleted_at`(`warehouse_uuid`, `product_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stocks` ADD CONSTRAINT `stocks_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
