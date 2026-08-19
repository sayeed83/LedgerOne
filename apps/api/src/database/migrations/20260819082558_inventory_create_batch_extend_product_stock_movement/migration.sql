-- AlterTable
ALTER TABLE `products` ADD COLUMN `is_batch_tracked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `stock_movements` ADD COLUMN `batch_id` BIGINT UNSIGNED NULL;

-- CreateTable
CREATE TABLE `batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_uuid` CHAR(36) NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL,
    `manufacture_date` DATETIME(3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `quantity` DECIMAL(18, 6) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'DEPLETED', 'EXPIRED', 'DISPOSED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `batches_uuid_key`(`uuid`),
    INDEX `idx_batches_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_batches_company_product`(`company_uuid`, `product_id`),
    INDEX `idx_batches_warehouse_product`(`warehouse_uuid`, `product_id`),
    INDEX `idx_batches_product`(`product_id`),
    INDEX `idx_batches_batch_number`(`batch_number`),
    INDEX `idx_batches_status`(`status`),
    INDEX `idx_batches_expiry_date`(`expiry_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_stock_movements_batch` ON `stock_movements`(`batch_id`);

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
