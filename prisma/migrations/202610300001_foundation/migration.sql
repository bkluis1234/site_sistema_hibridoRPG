-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `username` VARCHAR(32) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'PLAYER') NOT NULL DEFAULT 'PLAYER',
    `canCreateCampaigns` BOOLEAN NOT NULL DEFAULT false,
    `bootstrapKey` VARCHAR(32) NULL,
    `disabledAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_bootstrapKey_key`(`bootstrapKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `idleExpiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
    INDEX `sessions_userId_idx`(`userId`),
    INDEX `sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recovery_codes` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `codeHash` CHAR(64) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recovery_codes_codeHash_key`(`codeHash`),
    INDEX `recovery_codes_userId_usedAt_idx`(`userId`, `usedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `privilege_invites` (
    `id` CHAR(36) NOT NULL,
    `codeHash` CHAR(64) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `privilege_invites_codeHash_key`(`codeHash`),
    INDEX `privilege_invites_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `shareSheets` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaigns_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_members` (
    `id` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `role` ENUM('GM', 'PLAYER') NOT NULL DEFAULT 'PLAYER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaign_members_userId_idx`(`userId`),
    UNIQUE INDEX `campaign_members_campaignId_userId_key`(`campaignId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_invites` (
    `id` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `codeHash` CHAR(64) NOT NULL,
    `role` ENUM('GM', 'PLAYER') NOT NULL DEFAULT 'PLAYER',
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campaign_invites_codeHash_key`(`codeHash`),
    INDEX `campaign_invites_campaignId_expiresAt_idx`(`campaignId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `characters` (
    `id` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NULL,
    `name` VARCHAR(80) NOT NULL,
    `concept` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `rulesVersion` VARCHAR(20) NOT NULL DEFAULT '2.6',
    `version` INTEGER NOT NULL DEFAULT 1,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `characters_ownerId_archivedAt_idx`(`ownerId`, `archivedAt`),
    INDEX `characters_campaignId_idx`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_attributes` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `value` INTEGER NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_attributes_characterId_key_key`(`characterId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_skills` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `trained` BOOLEAN NOT NULL DEFAULT false,
    `modifier` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_skills_characterId_key_key`(`characterId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_resources` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `current` INTEGER NOT NULL,
    `maximum` INTEGER NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_resources_characterId_key_key`(`characterId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_items` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventory_items_characterId_idx`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_weapons` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `notes` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `character_weapons_characterId_idx`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_conditions` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `key` VARCHAR(60) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `character_conditions_characterId_key_key`(`characterId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_injuries` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `description` TEXT NOT NULL,
    `healedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `character_injuries_characterId_idx`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_change_requests` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `requesterId` CHAR(36) NOT NULL,
    `reviewerId` CHAR(36) NULL,
    `baseVersion` INTEGER NOT NULL,
    `patch` JSON NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `character_change_requests_characterId_status_idx`(`characterId`, `status`),
    INDEX `character_change_requests_requesterId_idx`(`requesterId`),
    INDEX `character_change_requests_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `recordVersion` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `character_audit_logs_characterId_createdAt_idx`(`characterId`, `createdAt`),
    INDEX `character_audit_logs_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `targetId` VARCHAR(100) NULL,
    `reason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_audit_logs_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recovery_codes` ADD CONSTRAINT `recovery_codes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `privilege_invites` ADD CONSTRAINT `privilege_invites_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_members` ADD CONSTRAINT `campaign_members_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_members` ADD CONSTRAINT `campaign_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_invites` ADD CONSTRAINT `campaign_invites_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_invites` ADD CONSTRAINT `campaign_invites_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `characters` ADD CONSTRAINT `characters_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `characters` ADD CONSTRAINT `characters_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_attributes` ADD CONSTRAINT `character_attributes_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_skills` ADD CONSTRAINT `character_skills_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_resources` ADD CONSTRAINT `character_resources_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_weapons` ADD CONSTRAINT `character_weapons_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_conditions` ADD CONSTRAINT `character_conditions_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_injuries` ADD CONSTRAINT `character_injuries_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_change_requests` ADD CONSTRAINT `character_change_requests_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_change_requests` ADD CONSTRAINT `character_change_requests_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_change_requests` ADD CONSTRAINT `character_change_requests_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_audit_logs` ADD CONSTRAINT `character_audit_logs_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_audit_logs` ADD CONSTRAINT `character_audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Registro de versões válido também para acessos externos ao Prisma.
ALTER TABLE `users` ADD CONSTRAINT `users_version_positive` CHECK (`version` >= 1);
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_version_positive` CHECK (`version` >= 1);
ALTER TABLE `characters` ADD CONSTRAINT `characters_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_attributes` ADD CONSTRAINT `character_attributes_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_skills` ADD CONSTRAINT `character_skills_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_resources` ADD CONSTRAINT `character_resources_version_positive` CHECK (`version` >= 1);
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_weapons` ADD CONSTRAINT `character_weapons_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_conditions` ADD CONSTRAINT `character_conditions_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_injuries` ADD CONSTRAINT `character_injuries_version_positive` CHECK (`version` >= 1);
ALTER TABLE `character_change_requests` ADD CONSTRAINT `character_change_requests_version_positive` CHECK (`version` >= 1);
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_quantity_nonnegative` CHECK (`quantity` >= 0);
