-- AlterTable
ALTER TABLE `campaign_invites` ADD COLUMN `maxUses` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `useCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `campaign_members` ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'REMOVED', 'REJECTED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `gmNotes` TEXT NULL,
    ADD COLUMN `imagePath` VARCHAR(500) NULL,
    ADD COLUMN `notices` TEXT NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `systemVersion` VARCHAR(20) NOT NULL DEFAULT '2.6';

-- AlterTable
ALTER TABLE `character_audit_logs` ADD COLUMN `campaignScopeId` CHAR(36) NULL,
    ADD COLUMN `reason` VARCHAR(1000) NULL,
    ADD COLUMN `visibility` ENUM('PUBLIC', 'PRIVATE', 'GM_ONLY') NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE `character_change_requests` ADD COLUMN `kind` VARCHAR(20) NOT NULL DEFAULT 'ATTRIBUTES',
    ADD COLUMN `reason` VARCHAR(1000) NULL,
    ADD COLUMN `reviewComment` VARCHAR(1000) NULL;

-- AlterTable
ALTER TABLE `characters` ADD COLUMN `publicFields` JSON NULL,
    ADD COLUMN `sharingEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sharingVersion` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `campaign_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `targetId` VARCHAR(100) NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `reason` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campaign_audit_logs_campaignId_createdAt_idx`(`campaignId`, `createdAt`),
    INDEX `campaign_audit_logs_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_notes` (
    `id` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NULL,
    `characterId` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `body` TEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'GM_ONLY') NOT NULL DEFAULT 'PRIVATE',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `character_notes_characterId_visibility_idx`(`characterId`, `visibility`),
    INDEX `character_notes_campaignId_visibility_idx`(`campaignId`, `visibility`),
    INDEX `character_notes_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `message` VARCHAR(280) NOT NULL,
    `linkPath` VARCHAR(500) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `management_operations` (
    `id` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NOT NULL,
    `operationId` CHAR(36) NOT NULL,
    `requestHash` CHAR(64) NOT NULL,
    `result` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `management_operations_actorId_operationId_key`(`actorId`, `operationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_authorizations` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `sessionId` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `strong` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_authorizations_tokenHash_key`(`tokenHash`),
    INDEX `admin_authorizations_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_settings` (
    `id` VARCHAR(20) NOT NULL DEFAULT 'global',
    `registrationOpen` BOOLEAN NOT NULL DEFAULT true,
    `campaignCreationEnabled` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `character_audit_logs_campaignScopeId_visibility_idx` ON `character_audit_logs`(`campaignScopeId`, `visibility`);

-- AddForeignKey
ALTER TABLE `character_audit_logs` ADD CONSTRAINT `character_audit_logs_campaignScopeId_fkey` FOREIGN KEY (`campaignScopeId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_audit_logs` ADD CONSTRAINT `campaign_audit_logs_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_audit_logs` ADD CONSTRAINT `campaign_audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_notes` ADD CONSTRAINT `character_notes_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `character_notes` ADD CONSTRAINT `character_notes_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_notes` ADD CONSTRAINT `character_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `management_operations` ADD CONSTRAINT `management_operations_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_authorizations` ADD CONSTRAINT `admin_authorizations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_authorizations` ADD CONSTRAINT `admin_authorizations_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve vínculos existentes e histórico; nada é publicado automaticamente.
UPDATE campaigns SET status=IF(archivedAt IS NULL,'ACTIVE','ARCHIVED');
UPDATE campaign_invites SET useCount=1 WHERE usedAt IS NOT NULL;
INSERT INTO platform_settings (id,registrationOpen,campaignCreationEnabled,version,createdAt,updatedAt) VALUES ('global',true,true,1,NOW(3),NOW(3));
ALTER TABLE campaign_invites ADD CONSTRAINT campaign_invite_limits CHECK (maxUses BETWEEN 1 AND 100 AND useCount BETWEEN 0 AND maxUses AND version>=1);
ALTER TABLE campaign_members ADD CONSTRAINT campaign_member_version_positive CHECK (version>=1);
ALTER TABLE characters ADD CONSTRAINT sharing_version_positive CHECK (sharingVersion>=1);
ALTER TABLE character_notes ADD CONSTRAINT note_scope_valid CHECK ((visibility='GM_ONLY' AND campaignId IS NOT NULL) OR (visibility<>'GM_ONLY' AND campaignId IS NULL));
ALTER TABLE character_notes ADD CONSTRAINT note_version_positive CHECK (version>=1);
ALTER TABLE platform_settings ADD CONSTRAINT platform_version_positive CHECK (version>=1);
