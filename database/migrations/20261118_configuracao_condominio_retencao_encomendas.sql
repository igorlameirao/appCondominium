-- Retenção de histórico de encomendas e fotografias (ConfiguracaoCondominio — §12 planejamento encomendas).
-- Convenção: NULL = não definido (padrão aplicado na leitura); 0 = tempo indeterminado; valor > 0 = meses.
USE condominium;

ALTER TABLE `ConfiguracaoCondominio`
  ADD COLUMN `RetencaoHistoricoEncomendasMeses` INT NULL DEFAULT NULL AFTER `CorPadrao`,
  ADD COLUMN `RetencaoFotosEncomendasMeses` INT NULL DEFAULT NULL AFTER `RetencaoHistoricoEncomendasMeses`;