-- CreateTable
CREATE TABLE `user_credentials` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_uuid` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_mfa_enabled` BOOLEAN NOT NULL DEFAULT false,
    `mfa_secret` VARCHAR(255) NULL,
    `failed_login_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_credentials_uuid_key`(`uuid`),
    UNIQUE INDEX `user_credentials_user_uuid_key`(`user_uuid`),
    INDEX `idx_user_credentials_tenant_id`(`tenant_id`),
    UNIQUE INDEX `uq_user_credentials_tenant_email_deleted_at`(`tenant_id`, `email`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_credential_id` BIGINT UNSIGNED NOT NULL,
    `jti` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_from_ip` VARCHAR(45) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refresh_tokens_uuid_key`(`uuid`),
    UNIQUE INDEX `refresh_tokens_jti_key`(`jti`),
    INDEX `idx_refresh_tokens_user_credential_id`(`user_credential_id`),
    INDEX `idx_refresh_tokens_active_sessions`(`tenant_id`, `user_credential_id`, `revoked_at`),
    INDEX `idx_refresh_tokens_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_credential_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `password_reset_tokens_uuid_key`(`uuid`),
    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `idx_password_reset_tokens_user_credential_id`(`user_credential_id`),
    INDEX `idx_password_reset_tokens_active_lookup`(`tenant_id`, `user_credential_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- CreateTable
CREATE TABLE `login_attempts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_credential_id` BIGINT UNSIGNED NULL,
    `email_attempted` VARCHAR(255) NOT NULL,
    `is_successful` BOOLEAN NOT NULL,
    `source_ip` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `login_attempts_uuid_key`(`uuid`),
    INDEX `idx_login_attempts_user_credential_id`(`user_credential_id`),
    INDEX `idx_login_attempts_lockout_lookup`(`tenant_id`, `email_attempted`, `created_at`),
    INDEX `idx_login_attempts_source_ip_lookup`(`tenant_id`, `source_ip`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_credential_id_fkey` FOREIGN KEY (`user_credential_id`) REFERENCES `user_credentials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_credential_id_fkey` FOREIGN KEY (`user_credential_id`) REFERENCES `user_credentials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `login_attempts` ADD CONSTRAINT `login_attempts_user_credential_id_fkey` FOREIGN KEY (`user_credential_id`) REFERENCES `user_credentials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
