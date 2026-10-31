-- Acréscimos compatíveis: códigos anteriores não expiram retroativamente.
ALTER TABLE `recovery_codes` ADD COLUMN `expiresAt` DATETIME(3) NULL;

CREATE TABLE `tutorial_progress` (
  `id` CHAR(36) NOT NULL,
  `userId` CHAR(36) NOT NULL,
  `guideKey` VARCHAR(40) NOT NULL,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tutorial_progress_userId_guideKey_key` (`userId`, `guideKey`),
  CONSTRAINT `tutorial_progress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
