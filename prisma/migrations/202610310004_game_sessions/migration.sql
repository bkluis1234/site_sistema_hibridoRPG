-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `itemTransfersEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `transferApprovalMode` VARCHAR(30) NOT NULL DEFAULT 'RECIPIENT';

-- AlterTable
ALTER TABLE `dice_rolls` ADD COLUMN `byGM` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `campaignId` CHAR(36) NULL,
    ADD COLUMN `category` VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN `characterName` VARCHAR(80) NULL,
    ADD COLUMN `contextModifier` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `gameSessionId` CHAR(36) NULL,
    ADD COLUMN `modifierReason` VARCHAR(500) NULL,
    ADD COLUMN `privateToGM` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `visibility` ENUM('PUBLIC', 'PRIVATE', 'GM_ONLY', 'GM_SHARED') NOT NULL DEFAULT 'PRIVATE',
    MODIFY `characterId` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `game_sessions` (
    `id` CHAR(36) NOT NULL,
    `campaignId` CHAR(36) NOT NULL,
    `hostId` CHAR(36) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `activeSlot` INTEGER NULL,
    `privateRollsToGM` BOOLEAN NOT NULL DEFAULT true,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `narrativeSummary` TEXT NULL,
    `snapshot` JSON NULL,
    `eventSequence` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `game_sessions_campaignId_createdAt_idx`(`campaignId`, `createdAt`),
    UNIQUE INDEX `game_sessions_campaignId_activeSlot_key`(`campaignId`, `activeSlot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_participants` (
    `id` CHAR(36) NOT NULL,
    `gameSessionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NULL,
    `characterName` VARCHAR(80) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `session_participants_characterId_idx`(`characterId`),
    UNIQUE INDEX `session_participants_gameSessionId_userId_key`(`gameSessionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_events` (
    `id` CHAR(36) NOT NULL,
    `gameSessionId` CHAR(36) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `recipientId` CHAR(36) NULL,
    `ownerId` CHAR(36) NULL,
    `characterId` CHAR(36) NULL,
    `type` VARCHAR(60) NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'GM_ONLY') NOT NULL DEFAULT 'PUBLIC',
    `privateToGM` BOOLEAN NOT NULL DEFAULT false,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `session_events_gameSessionId_createdAt_idx`(`gameSessionId`, `createdAt`),
    INDEX `session_events_authorId_idx`(`authorId`),
    INDEX `session_events_recipientId_idx`(`recipientId`),
    INDEX `session_events_ownerId_idx`(`ownerId`),
    INDEX `session_events_characterId_idx`(`characterId`),
    UNIQUE INDEX `session_events_gameSessionId_sequence_key`(`gameSessionId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_notes` (
    `id` CHAR(36) NOT NULL,
    `gameSessionId` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `body` TEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'GM_ONLY') NOT NULL DEFAULT 'PRIVATE',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `session_notes_gameSessionId_visibility_createdAt_idx`(`gameSessionId`, `visibility`, `createdAt`),
    INDEX `session_notes_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presence_records` (
    `id` CHAR(36) NOT NULL,
    `gameSessionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `authSessionId` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `away` BOOLEAN NOT NULL DEFAULT false,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `presence_records_gameSessionId_lastSeenAt_idx`(`gameSessionId`, `lastSeenAt`),
    INDEX `presence_records_authSessionId_idx`(`authSessionId`),
    UNIQUE INDEX `presence_records_gameSessionId_userId_clientId_key`(`gameSessionId`, `userId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_transfers` (
    `id` CHAR(36) NOT NULL,
    `gameSessionId` CHAR(36) NOT NULL,
    `sourceCharacterId` CHAR(36) NOT NULL,
    `destinationCharacterId` CHAR(36) NOT NULL,
    `sourceItemId` CHAR(36) NULL,
    `requesterId` CHAR(36) NOT NULL,
    `reviewerId` CHAR(36) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `quantity` INTEGER NOT NULL,
    `itemVersion` INTEGER NOT NULL,
    `itemSnapshot` JSON NOT NULL,
    `reason` VARCHAR(500) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `item_transfers_gameSessionId_status_createdAt_idx`(`gameSessionId`, `status`, `createdAt`),
    INDEX `item_transfers_sourceItemId_idx`(`sourceItemId`),
    INDEX `item_transfers_destinationCharacterId_idx`(`destinationCharacterId`),
    INDEX `item_transfers_requesterId_idx`(`requesterId`),
    INDEX `item_transfers_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `dice_rolls_gameSessionId_createdAt_idx` ON `dice_rolls`(`gameSessionId`, `createdAt`);

-- CreateIndex
CREATE INDEX `dice_rolls_campaignId_idx` ON `dice_rolls`(`campaignId`);

-- AddForeignKey
ALTER TABLE `dice_rolls` ADD CONSTRAINT `dice_rolls_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dice_rolls` ADD CONSTRAINT `dice_rolls_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_sessions` ADD CONSTRAINT `game_sessions_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_sessions` ADD CONSTRAINT `game_sessions_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_participants` ADD CONSTRAINT `session_participants_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_participants` ADD CONSTRAINT `session_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_participants` ADD CONSTRAINT `session_participants_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_events` ADD CONSTRAINT `session_events_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_events` ADD CONSTRAINT `session_events_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_events` ADD CONSTRAINT `session_events_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_events` ADD CONSTRAINT `session_events_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_events` ADD CONSTRAINT `session_events_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_notes` ADD CONSTRAINT `session_notes_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_notes` ADD CONSTRAINT `session_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presence_records` ADD CONSTRAINT `presence_records_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presence_records` ADD CONSTRAINT `presence_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presence_records` ADD CONSTRAINT `presence_records_authSessionId_fkey` FOREIGN KEY (`authSessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_sourceCharacterId_fkey` FOREIGN KEY (`sourceCharacterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_destinationCharacterId_fkey` FOREIGN KEY (`destinationCharacterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_sourceItemId_fkey` FOREIGN KEY (`sourceItemId`) REFERENCES `inventory_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_transfers` ADD CONSTRAINT `item_transfers_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Um único slot vivo por campanha; versões e contadores independentes dos cursores públicos.
ALTER TABLE game_sessions ADD CONSTRAINT game_session_bounds CHECK (version>=1 AND eventSequence>=0 AND ((status IN ('ACTIVE','PAUSED') AND activeSlot IS NOT NULL AND activeSlot=1) OR (status NOT IN ('ACTIVE','PAUSED') AND activeSlot IS NULL)));
ALTER TABLE session_participants ADD CONSTRAINT game_participant_version CHECK (version>=1);
ALTER TABLE session_events ADD CONSTRAINT game_event_sequence_positive CHECK (sequence>=1);
ALTER TABLE session_notes ADD CONSTRAINT game_note_version CHECK (version>=1);
ALTER TABLE item_transfers ADD CONSTRAINT transfer_positive CHECK (version>=1 AND quantity>0 AND itemVersion>=1);
