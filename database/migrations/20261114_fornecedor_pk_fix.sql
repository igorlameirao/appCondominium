-- Completa alteração de fornecedor quando a migração parou no DROP PRIMARY KEY.
USE appcondominium;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `despesa` DROP FOREIGN KEY `fk_Despesa_IdFornecedor`;
ALTER TABLE `ofertaconcorrencia` DROP FOREIGN KEY `fk_OfertaConcorrencia_IdFornecedor`;

ALTER TABLE `fornecedor` DROP PRIMARY KEY;
ALTER TABLE `fornecedor` ADD COLUMN `IdFornecedor` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE `fornecedor` ADD COLUMN `Ativo` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `fornecedor` ADD UNIQUE KEY `IdxUKFornecedorPessoaCondominio` (`IdPessoa`, `IdCondominio`);
ALTER TABLE `fornecedor` ADD CONSTRAINT `fk_Fornecedor_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `despesa` ADD CONSTRAINT `fk_Despesa_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `ofertaconcorrencia` ADD CONSTRAINT `fk_OfertaConcorrencia_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT;

SET FOREIGN_KEY_CHECKS = 1;