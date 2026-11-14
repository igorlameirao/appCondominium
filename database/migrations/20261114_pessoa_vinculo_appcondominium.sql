-- Migração appcondominium (MySQL local). Sem DROP destrutivo.
-- Banco alvo: appcondominium (não condominium). Tabelas em minúsculas conforme instância local.
USE appcondominium;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `papelvinculo` (
  `CodigoPapelVinculo` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(150) NOT NULL,
  `EscopoPapel` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`CodigoPapelVinculo`),
  UNIQUE KEY `uq_PapelVinculo_Descricao` (`Descricao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `papelvinculo` (`CodigoPapelVinculo`, `Descricao`, `EscopoPapel`) VALUES
(1, 'Proprietário', 2), (2, 'Morador', 2), (3, 'Locatário', 2), (4, 'Dependente', 2),
(5, 'Familiar', 2), (6, 'Hóspede', 2), (7, 'Corretor', 2),
(10, 'Síndico', 1), (11, 'Subsíndico', 1), (12, 'Conselheiro', 1), (13, 'Administradora', 1),
(14, 'Funcionário', 1), (15, 'Prestador', 1), (16, 'Terceirizado', 1), (17, 'Fornecedor', 1),
(20, 'Representante Legal', 3), (21, 'Familiar', 3), (22, 'Dependente', 3);

CREATE TABLE IF NOT EXISTS `pessoavinculo` (
  `IdVinculo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdPessoa` INT UNSIGNED NOT NULL,
  `CodigoPapelVinculo` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdUnidade` INT UNSIGNED NULL,
  `IdPessoaRelacionada` INT UNSIGNED NULL,
  `DataInicio` DATE NOT NULL,
  `DataFim` DATE NULL,
  `IdPerfil` INT UNSIGNED NULL,
  `Responsavel` TINYINT(1) NOT NULL,
  `Observacao` VARCHAR(500) NULL,
  PRIMARY KEY (`IdVinculo`),
  KEY `IdxPessoaVinculoAtivo` (`IdPessoa`, `IdCondominio`, `CodigoPapelVinculo`, `DataInicio`, `DataFim`),
  CONSTRAINT `fk_PessoaVinculo_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_CodigoPapelVinculo` FOREIGN KEY (`CodigoPapelVinculo`) REFERENCES `papelvinculo` (`CodigoPapelVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdPessoaRelacionada` FOREIGN KEY (`IdPessoaRelacionada`) REFERENCES `pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PessoaCondominio -> PessoaVinculo (schema local sem IdPerfil em pessoacondominio)
INSERT INTO `pessoavinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `DataInicio`, `DataFim`, `Responsavel`)
SELECT pc.`IdPessoa`,
  CASE pc.`TipoVinculo`
    WHEN 1 THEN 14 WHEN 2 THEN 10 WHEN 3 THEN 11 WHEN 4 THEN 12
    WHEN 5 THEN 14 WHEN 6 THEN 16 WHEN 7 THEN 15 WHEN 8 THEN 15
    ELSE 14
  END,
  pc.`IdCondominio`, pc.`DataInicio`, pc.`DataFim`, 0
FROM `pessoacondominio` pc
WHERE NOT EXISTS (
    SELECT 1 FROM `pessoavinculo` pv
    WHERE pv.`IdPessoa` = pc.`IdPessoa` AND pv.`IdCondominio` = pc.`IdCondominio`
      AND pv.`DataInicio` = pc.`DataInicio` AND pv.`IdUnidade` IS NULL
  );

INSERT INTO `pessoavinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `IdUnidade`, `DataInicio`, `DataFim`, `Responsavel`)
SELECT pu.`IdPessoa`,
  CASE pu.`TipoVinculo`
    WHEN 1 THEN 7 WHEN 2 THEN 1 WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 2
    ELSE 2
  END,
  u.`IdCondominio`, pu.`IdUnidade`, pu.`DataInicio`, pu.`DataFim`,
  IFNULL(pu.`Resposavel`, 0)
FROM `pessoaunidade` pu
JOIN `unidade` u ON u.`IdUnidade` = pu.`IdUnidade`
WHERE NOT EXISTS (
  SELECT 1 FROM `pessoavinculo` pv
  WHERE pv.`IdPessoa` = pu.`IdPessoa` AND pv.`IdUnidade` = pu.`IdUnidade`
    AND pv.`DataInicio` = pu.`DataInicio`
);

-- Fornecedor: PK IdPessoa -> IdFornecedor + UK (IdPessoa, IdCondominio), FK para pessoa
ALTER TABLE `despesa` DROP FOREIGN KEY `fk_Despesa_IdFornecedor`;
ALTER TABLE `ofertaconcorrencia` DROP FOREIGN KEY `fk_OfertaConcorrencia_IdFornecedor`;

SET @fk_pessoa := (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND CONSTRAINT_NAME = 'fk_Fornecedor_IdPessoa' LIMIT 1);
SET @drop_fk := IF(@fk_pessoa IS NOT NULL, 'ALTER TABLE `fornecedor` DROP FOREIGN KEY `fk_Fornecedor_IdPessoa`', 'SELECT 1');
PREPARE stmt FROM @drop_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE `fornecedor` DROP PRIMARY KEY;
ALTER TABLE `fornecedor` ADD COLUMN `IdFornecedor` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE `fornecedor` ADD COLUMN `Ativo` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `fornecedor` ADD UNIQUE KEY `IdxUKFornecedorPessoaCondominio` (`IdPessoa`, `IdCondominio`);
ALTER TABLE `fornecedor` ADD CONSTRAINT `fk_Fornecedor_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `despesa` ADD CONSTRAINT `fk_Despesa_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `ofertaconcorrencia` ADD CONSTRAINT `fk_OfertaConcorrencia_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT;

SET FOREIGN_KEY_CHECKS = 1;