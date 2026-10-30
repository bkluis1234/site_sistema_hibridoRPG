-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `physicalSkillKeys` JSON NULL;

-- AlterTable
ALTER TABLE `character_audit_logs` ADD COLUMN `afterData` JSON NULL,
    ADD COLUMN `beforeData` JSON NULL;

-- AlterTable
ALTER TABLE `character_injuries` ADD COLUMN `consequences` TEXT NULL,
    ADD COLUMN `location` VARCHAR(160) NOT NULL DEFAULT '',
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `character_resources` DROP COLUMN `maximum`;

-- AlterTable
ALTER TABLE `character_weapons` ADD COLUMN `inventoryItemId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `characters` ADD COLUMN `age` INTEGER NULL,
    ADD COLUMN `appearance` TEXT NULL,
    ADD COLUMN `attributesVersion` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `backstory` TEXT NULL,
    ADD COLUMN `height` DECIMAL(4, 2) NULL,
    ADD COLUMN `identityVersion` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `imagePath` VARCHAR(500) NULL,
    ADD COLUMN `nickname` VARCHAR(80) NOT NULL DEFAULT '',
    ADD COLUMN `objectives` TEXT NULL,
    ADD COLUMN `personalNotes` TEXT NULL,
    ADD COLUMN `personality` TEXT NULL,
    ADD COLUMN `profession` VARCHAR(160) NOT NULL DEFAULT '',
    ADD COLUMN `skillsVersion` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `weight` DECIMAL(7, 2) NULL,
    MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `inventory_items` ADD COLUMN `damage` VARCHAR(80) NOT NULL DEFAULT '',
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `equipment` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `slotsPerUnit` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `type` VARCHAR(100) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `character_condition_states` (
    `characterId` CHAR(36) NOT NULL,
    `fatigue` INTEGER NOT NULL DEFAULT 0,
    `bleeding` BOOLEAN NOT NULL DEFAULT false,
    `critical` BOOLEAN NOT NULL DEFAULT false,
    `incapacitated` BOOLEAN NOT NULL DEFAULT false,
    `successes` INTEGER NOT NULL DEFAULT 0,
    `failures` INTEGER NOT NULL DEFAULT 0,
    `stabilization` VARCHAR(20) NOT NULL DEFAULT 'NONE',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_operations` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `operationId` CHAR(36) NOT NULL,
    `requestHash` CHAR(64) NOT NULL,
    `result` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `character_operations_characterId_operationId_key`(`characterId`, `operationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dice_rolls` (
    `id` CHAR(36) NOT NULL,
    `characterId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `expression` VARCHAR(20) NOT NULL,
    `results` JSON NOT NULL,
    `initialResults` JSON NOT NULL,
    `total` INTEGER NOT NULL,
    `skillKey` VARCHAR(60) NULL,
    `target` INTEGER NULL,
    `baseTarget` INTEGER NULL,
    `fatiguePenalty` INTEGER NOT NULL DEFAULT 0,
    `fatigueApplied` BOOLEAN NOT NULL DEFAULT false,
    `outcome` VARCHAR(20) NULL,
    `effortMode` VARCHAR(20) NOT NULL DEFAULT 'NONE',
    `retryRequestedAt` DATETIME(3) NULL,
    `retryAuthorizedById` CHAR(36) NULL,
    `retryCategory` VARCHAR(20) NULL,
    `finalizedAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dice_rolls_characterId_createdAt_idx`(`characterId`, `createdAt`),
    INDEX `dice_rolls_userId_idx`(`userId`),
    INDEX `dice_rolls_retryAuthorizedById_idx`(`retryAuthorizedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `character_weapons_inventoryItemId_key` ON `character_weapons`(`inventoryItemId`);

-- AddForeignKey
-- A relação com inventário é adicionada após converter equipamentos legados.

-- AddForeignKey
ALTER TABLE `character_condition_states` ADD CONSTRAINT `character_condition_states_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_operations` ADD CONSTRAINT `character_operations_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dice_rolls` ADD CONSTRAINT `dice_rolls_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dice_rolls` ADD CONSTRAINT `dice_rolls_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dice_rolls` ADD CONSTRAINT `dice_rolls_retryAuthorizedById_fkey` FOREIGN KEY (`retryAuthorizedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inicialização das fichas anteriores, sem alterar identificação ou recursos existentes.
INSERT INTO character_attributes (id,characterId,`key`,value,version,createdAt,updatedAt) SELECT UUID(),c.id,'AGI',1,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_attributes a WHERE a.characterId=c.id AND a.`key`='AGI');
INSERT INTO character_attributes (id,characterId,`key`,value,version,createdAt,updatedAt) SELECT UUID(),c.id,'FOR',1,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_attributes a WHERE a.characterId=c.id AND a.`key`='FOR');
INSERT INTO character_attributes (id,characterId,`key`,value,version,createdAt,updatedAt) SELECT UUID(),c.id,'INT',1,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_attributes a WHERE a.characterId=c.id AND a.`key`='INT');
INSERT INTO character_attributes (id,characterId,`key`,value,version,createdAt,updatedAt) SELECT UUID(),c.id,'PRE',1,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_attributes a WHERE a.characterId=c.id AND a.`key`='PRE');
INSERT INTO character_attributes (id,characterId,`key`,value,version,createdAt,updatedAt) SELECT UUID(),c.id,'VIG',1,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_attributes a WHERE a.characterId=c.id AND a.`key`='VIG');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'atletismo',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='atletismo');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'acrobacia',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='acrobacia');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'crime',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='crime');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'diplomacia',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='diplomacia');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'fortitude',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='fortitude');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'furtividade',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='furtividade');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'iniciativa',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='iniciativa');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'intimidacao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='intimidacao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'intuicao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='intuicao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'investigacao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='investigacao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'luta',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='luta');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'medicina',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='medicina');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'ocultismo',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='ocultismo');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'percepcao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='percepcao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'pilotagem',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='pilotagem');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'pontaria',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='pontaria');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'profissao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='profissao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'reflexos',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='reflexos');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'religiao',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='religiao');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'sobrevivencia',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='sobrevivencia');
INSERT INTO character_skills (id,characterId,`key`,trained,modifier,version,createdAt,updatedAt) SELECT UUID(),c.id,'vontade',false,0,1,NOW(3),NOW(3) FROM characters c WHERE NOT EXISTS (SELECT 1 FROM character_skills a WHERE a.characterId=c.id AND a.`key`='vontade');
INSERT INTO character_resources (id,characterId,`key`,current,version,createdAt,updatedAt) SELECT UUID(),c.id,'PV',10+2*a.value,1,NOW(3),NOW(3) FROM characters c JOIN character_attributes a ON a.characterId=c.id AND a.`key`='VIG' WHERE NOT EXISTS (SELECT 1 FROM character_resources r WHERE r.characterId=c.id AND r.`key`='PV');
INSERT INTO character_resources (id,characterId,`key`,current,version,createdAt,updatedAt) SELECT UUID(),c.id,'SAN',10+2*a.value,1,NOW(3),NOW(3) FROM characters c JOIN character_attributes a ON a.characterId=c.id AND a.`key`='PRE' WHERE NOT EXISTS (SELECT 1 FROM character_resources r WHERE r.characterId=c.id AND r.`key`='SAN');
INSERT INTO character_resources (id,characterId,`key`,current,version,createdAt,updatedAt) SELECT UUID(),c.id,'PE',3+a.value,1,NOW(3),NOW(3) FROM characters c JOIN character_attributes a ON a.characterId=c.id AND a.`key`='PRE' WHERE NOT EXISTS (SELECT 1 FROM character_resources r WHERE r.characterId=c.id AND r.`key`='PE');

INSERT INTO character_condition_states (characterId,fatigue,bleeding,critical,incapacitated,successes,failures,stabilization,version,createdAt,updatedAt)
SELECT c.id,0,false,r.current=0,r.current=0,0,0,IF(r.current=0,'UNSTABLE','NONE'),1,NOW(3),NOW(3) FROM characters c JOIN character_resources r ON r.characterId=c.id AND r.`key`='PV';
UPDATE character_injuries SET status='RESOLVED' WHERE healedAt IS NOT NULL;
-- Equipamentos preexistentes tornam-se itens únicos. Espaços desconhecidos precisam ser revisados pelo grupo.
UPDATE character_weapons SET inventoryItemId=UUID() WHERE inventoryItemId IS NULL;
INSERT INTO inventory_items (id,characterId,name,quantity,slotsPerUnit,equipment,type,damage,notes,version,createdAt,updatedAt)
SELECT inventoryItemId,characterId,name,1,0,true,'','',notes,1,createdAt,updatedAt FROM character_weapons;

ALTER TABLE `character_weapons` ADD CONSTRAINT `character_weapons_inventoryItemId_fkey` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE character_condition_states ADD CONSTRAINT condition_bounds CHECK (fatigue BETWEEN 0 AND 3 AND successes BETWEEN 0 AND 3 AND failures BETWEEN 0 AND 3 AND version>=1);
ALTER TABLE character_resources ADD CONSTRAINT resource_nonnegative CHECK (current>=0);
ALTER TABLE inventory_items ADD CONSTRAINT slots_nonnegative CHECK (slotsPerUnit>=0);
ALTER TABLE character_attributes ADD CONSTRAINT attribute_creation_bounds CHECK (value BETWEEN 0 AND 3);
ALTER TABLE characters ADD CONSTRAINT sheet_domain_versions CHECK (identityVersion>=1 AND attributesVersion>=1 AND skillsVersion>=1);
ALTER TABLE dice_rolls ADD CONSTRAINT roll_version_positive CHECK (version>=1);
