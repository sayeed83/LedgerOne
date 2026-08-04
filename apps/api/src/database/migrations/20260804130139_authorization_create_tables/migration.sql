-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_system_role` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `roles_uuid_key`(`uuid`),
    INDEX `idx_roles_tenant_status`(`tenant_id`, `status`),
    UNIQUE INDEX `uq_roles_tenant_name_deleted_at`(`tenant_id`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `permission_key` VARCHAR(180) NOT NULL,
    `module_name` VARCHAR(64) NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `action` ENUM('VIEW', 'CREATE', 'EDIT', 'APPROVE', 'DELETE') NOT NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `permissions_uuid_key`(`uuid`),
    UNIQUE INDEX `permissions_permission_key_key`(`permission_key`),
    INDEX `idx_permissions_module_name`(`module_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `role_permissions_uuid_key`(`uuid`),
    INDEX `idx_role_permissions_tenant_id`(`tenant_id`),
    INDEX `idx_role_permissions_role_id`(`role_id`),
    INDEX `idx_role_permissions_permission_id`(`permission_id`),
    UNIQUE INDEX `uq_role_permissions_role_permission_deleted_at`(`role_id`, `permission_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_uuid` CHAR(36) NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_roles_uuid_key`(`uuid`),
    INDEX `idx_user_roles_tenant_id`(`tenant_id`),
    INDEX `idx_user_roles_tenant_user_uuid`(`tenant_id`, `user_uuid`),
    INDEX `idx_user_roles_role_id`(`role_id`),
    UNIQUE INDEX `uq_user_roles_user_role_deleted_at`(`user_uuid`, `role_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
