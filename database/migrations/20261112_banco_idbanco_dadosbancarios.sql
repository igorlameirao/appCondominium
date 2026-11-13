-- Migração: estrutura aprovada de Banco (md_appCondominium.json) + DadosBancarios.IdBanco
-- Pré-requisito: Banco e DadosBancarios sem registros (COUNT(*) = 0).
-- Executar via túnel SSH conforme Database:Ssh em user-secrets da API.
-- Não desliga FOREIGN_KEY_CHECKS: remove e recria FKs explicitamente.

-- ---------------------------------------------------------------------------
-- Pré-voo (interromper se houver dados ou FKs inesperadas para Banco/DadosBancarios)
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS Banco_Rows FROM `Banco`;
SELECT COUNT(*) AS DadosBancarios_Rows FROM `DadosBancarios`;

SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IN ('Banco', 'DadosBancarios')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ---------------------------------------------------------------------------
-- DadosBancarios: CodigoBanco -> IdBanco (PK + FK)
-- ---------------------------------------------------------------------------
ALTER TABLE `DadosBancarios`
  DROP FOREIGN KEY `fk_DadosBancarios_CodigoBanco`;

ALTER TABLE `DadosBancarios`
  DROP PRIMARY KEY,
  DROP COLUMN `CodigoBanco`,
  ADD COLUMN `IdBanco` INT UNSIGNED NOT NULL AFTER `Conta`,
  ADD PRIMARY KEY (`Conta`, `IdBanco`, `Agencia`);

-- ---------------------------------------------------------------------------
-- Banco: recriação com IdBanco e demais campos aprovados (tabela vazia)
-- ---------------------------------------------------------------------------
DROP TABLE `Banco`;

CREATE TABLE `Banco` (
  `IdBanco` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `CodigoBanco` VARCHAR(3) NULL,
  `DigitoVerificador` VARCHAR(1) NULL,
  `Nome` VARCHAR(255) NOT NULL,
  `ISPB` VARCHAR(8) NOT NULL,
  `CNPJ` VARCHAR(14) NULL,
  `Ativo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IdBanco`),
  UNIQUE KEY `uq_Banco_CodigoBanco` (`CodigoBanco`),
  UNIQUE KEY `uq_Banco_ISPB` (`ISPB`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `DadosBancarios`
  ADD CONSTRAINT `fk_DadosBancarios_IdBanco`
    FOREIGN KEY (`IdBanco`) REFERENCES `Banco` (`IdBanco`)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Validação pós-migração
-- ---------------------------------------------------------------------------
SHOW CREATE TABLE `Banco`\G
SHOW CREATE TABLE `DadosBancarios`\G

SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IN ('Banco', 'Condominio')
  AND TABLE_NAME = 'DadosBancarios';

SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Banco'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
