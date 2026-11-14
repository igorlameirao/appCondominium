-- Migração desenvolvimento: PessoaCondominio / PessoaUnidade -> PessoaVinculo + PapelVinculo
-- Execute localmente após backup. NÃO executar em produção/remoto sem autorização explícita.
USE condominium;
SET FOREIGN_KEY_CHECKS = 0;

-- Catálogo (idempotente; alinhado ao gerador Hug)
CREATE TABLE IF NOT EXISTS `PapelVinculo` (
  `CodigoPapelVinculo` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(150) NOT NULL,
  `EscopoPapel` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`CodigoPapelVinculo`),
  UNIQUE KEY `uq_PapelVinculo_Descricao` (`Descricao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `PapelVinculo` (`CodigoPapelVinculo`, `Descricao`, `EscopoPapel`) VALUES
(1, 'Proprietário', 2), (2, 'Morador', 2), (3, 'Locatário', 2), (4, 'Dependente', 2),
(5, 'Familiar', 2), (6, 'Hóspede', 2), (7, 'Corretor', 2),
(10, 'Síndico', 1), (11, 'Subsíndico', 1), (12, 'Conselheiro', 1), (13, 'Administradora', 1),
(14, 'Funcionário', 1), (15, 'Prestador', 1), (16, 'Terceirizado', 1), (17, 'Fornecedor', 1),
(20, 'Representante Legal', 3), (21, 'Familiar (pessoa)', 3), (22, 'Dependente (pessoa)', 3);

CREATE TABLE IF NOT EXISTS `PessoaVinculo` (
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
  CONSTRAINT `fk_PessoaVinculo_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_CodigoPapelVinculo` FOREIGN KEY (`CodigoPapelVinculo`) REFERENCES `PapelVinculo` (`CodigoPapelVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdPessoaRelacionada` FOREIGN KEY (`IdPessoaRelacionada`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaVinculo_IdPerfil` FOREIGN KEY (`IdPerfil`) REFERENCES `PerfilAcesso` (`IdPerfil`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrar PessoaCondominio (mapa TipoVinculo legado -> CodigoPapelVinculo)
INSERT INTO `PessoaVinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `DataInicio`, `DataFim`, `IdPerfil`, `Responsavel`)
SELECT pc.`IdPessoa`,
  CASE pc.`TipoVinculo`
    WHEN 1 THEN 14 WHEN 2 THEN 10 WHEN 3 THEN 11 WHEN 4 THEN 12
    WHEN 5 THEN 14 WHEN 6 THEN 16 WHEN 7 THEN 15 WHEN 8 THEN 15
    ELSE 14
  END,
  pc.`IdCondominio`, pc.`DataInicio`, pc.`DataFim`, pc.`IdPerfil`, 0
FROM `PessoaCondominio` pc
WHERE NOT EXISTS (
  SELECT 1 FROM `PessoaVinculo` pv
  WHERE pv.`IdPessoa` = pc.`IdPessoa` AND pv.`IdCondominio` = pc.`IdCondominio`
    AND pv.`DataInicio` = pc.`DataInicio` AND pv.`IdPerfil` <=> pc.`IdPerfil`
);

-- Migrar PessoaUnidade
INSERT INTO `PessoaVinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `IdUnidade`, `DataInicio`, `DataFim`, `Responsavel`)
SELECT pu.`IdPessoa`,
  CASE pu.`TipoVinculo`
    WHEN 1 THEN 7 WHEN 2 THEN 1 WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 2
    ELSE 2
  END,
  u.`IdCondominio`, pu.`IdUnidade`, pu.`DataInicio`, pu.`DataFim`,
  IFNULL(pu.`Resposavel`, pu.`Responsavel`)
FROM `PessoaUnidade` pu
JOIN `Unidade` u ON u.`IdUnidade` = pu.`IdUnidade`
WHERE NOT EXISTS (
  SELECT 1 FROM `PessoaVinculo` pv
  WHERE pv.`IdPessoa` = pu.`IdPessoa` AND pv.`IdUnidade` = pu.`IdUnidade`
    AND pv.`DataInicio` = pu.`DataInicio`
);

-- Fornecedor: nova estrutura IdFornecedor (se ainda PK composta antiga)
-- Ajustar conforme schema local antes de DROP; ver database/schema.sql gerado.

-- Exemplo: GuardaEncomenda.IdVinculoRetirada (ajustar FK após migração de dados de saída)

-- Remover estruturas legadas somente após validação manual:
-- DROP TABLE IF EXISTS `PessoaUnidade`;
-- DROP TABLE IF EXISTS `PessoaCondominio`;

SET FOREIGN_KEY_CHECKS = 1;