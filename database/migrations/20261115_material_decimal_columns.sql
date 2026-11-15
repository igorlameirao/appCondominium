-- Preferível: dotnet run --project WebApi/AppCondominium.Tools -- migrate-material-tables
-- (usa a mesma connection string da API e cria FKs passo a passo).
--
-- Script manual (sem FKs no CREATE — evita falha em bloco único):

CREATE TABLE IF NOT EXISTS `AlocacaoMaterial` (
  `IdAlocacaoMaterial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdMaterial` INT UNSIGNED NOT NULL,
  `IdVinculo` INT UNSIGNED NOT NULL,
  `IdLocal` INT UNSIGNED NOT NULL,
  `DataHoraInicio` DATETIME NOT NULL,
  `DataHoraFim` DATETIME NULL,
  PRIMARY KEY (`IdAlocacaoMaterial`),
  KEY `idx_AlocacaoMaterial_DataHoraInicio` (`DataHoraInicio`),
  KEY `idx_AlocacaoMaterial_DataHoraFim` (`DataHoraFim`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `EntradaSaidaMaterialConsumo` (
  `IdEntradaSaidaMaterialConsumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `TipoLancamento` TINYINT UNSIGNED NOT NULL,
  `IdEstoqueMaterialConsumo` INT UNSIGNED NOT NULL,
  `IdTipoMaterial` INT UNSIGNED NOT NULL,
  `DataValidade` DATETIME NULL,
  `Lote` VARCHAR(20) NULL,
  `ValorUnitarioAquisicao` DECIMAL(10,2) UNSIGNED NULL,
  `Quantidade` DECIMAL(10,3) UNSIGNED NOT NULL,
  `UnidadeMedida` TINYINT UNSIGNED NOT NULL,
  `IdVinculo` INT UNSIGNED NULL,
  PRIMARY KEY (`IdEntradaSaidaMaterialConsumo`),
  KEY `idx_EntradaSaidaMaterialConsumo_DataValidade` (`DataValidade`),
  KEY `idx_EntradaSaidaMaterialConsumo_Lote` (`Lote`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FKs (podem falhar se já existirem — ignore erro Duplicate foreign key):
-- ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdCondominio` ...
-- Execute o comando migrate-material-tables para adicionar FKs automaticamente.