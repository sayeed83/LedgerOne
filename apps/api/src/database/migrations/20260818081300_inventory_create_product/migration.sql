-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `product_code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `product_category_id` BIGINT UNSIGNED NOT NULL,
    `unit_id` BIGINT UNSIGNED NULL,
    `is_stocked` BOOLEAN NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `products_uuid_key`(`uuid`),
    INDEX `idx_products_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_products_company_category`(`company_uuid`, `product_category_id`),
    UNIQUE INDEX `uq_products_company_product_code_deleted_at`(`company_uuid`, `product_code`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_product_category_id_fkey` FOREIGN KEY (`product_category_id`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
