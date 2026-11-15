-- Opcional: converte colunas que foram criadas como VARCHAR(255) para DECIMAL/SMALLINT.
-- Execute somente se não usar mais ConfigureLegacyVarcharDecimals no AppDbContext.

ALTER TABLE `Material`
  MODIFY COLUMN `VidaUtil` SMALLINT UNSIGNED NOT NULL,
  MODIFY COLUMN `ValorAquisicao` DECIMAL(10,2) UNSIGNED NOT NULL,
  MODIFY COLUMN `ValorDepreciavel` DECIMAL(10,2) UNSIGNED NOT NULL;

ALTER TABLE `EstoqueMaterialConsumo`
  MODIFY COLUMN `ValorUnitarioUltimaAquisicao` DECIMAL(10,2) UNSIGNED NULL,
  MODIFY COLUMN `ValorUnitarioMedio` DECIMAL(10,2) UNSIGNED NULL,
  MODIFY COLUMN `Quantidade` DECIMAL(10,3) UNSIGNED NOT NULL;

ALTER TABLE `EntradaSaidaMaterialConsumo`
  MODIFY COLUMN `ValorUnitarioAquisicao` DECIMAL(10,2) UNSIGNED NULL,
  MODIFY COLUMN `Quantidade` DECIMAL(10,3) UNSIGNED NOT NULL;