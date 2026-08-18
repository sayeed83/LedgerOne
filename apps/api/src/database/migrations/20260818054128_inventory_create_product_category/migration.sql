-- CreateTable
CREATE TABLE `product_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `parent_product_category_id` BIGINT UNSIGNED NULL,
    `default_tax_group_uuid` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `product_categories_uuid_key`(`uuid`),
    INDEX `idx_product_categories_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_product_categories_company_parent`(`company_uuid`, `parent_product_category_id`),
    UNIQUE INDEX `uq_product_categories_company_parent_name_deleted_at`(`company_uuid`, `parent_product_category_id`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_parent_product_category_id_fkey` FOREIGN KEY (`parent_product_category_id`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
