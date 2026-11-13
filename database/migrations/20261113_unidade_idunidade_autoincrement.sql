-- IdUnidade passa a ser AUTO_INCREMENT (chave gerada pelo banco).
-- O MySQL exige remover FKs que apontam para Unidade antes do MODIFY.

ALTER TABLE `Unidade`
  MODIFY COLUMN `IdHidrometro` INT UNSIGNED NULL;

ALTER TABLE `Hidrometro` DROP FOREIGN KEY `fk_Hidrometro_IdUnidade`;
ALTER TABLE `ConsumoAgua` DROP FOREIGN KEY `fk_ConsumoAgua_IdUnidade`;
ALTER TABLE `AluguelEquipamento` DROP FOREIGN KEY `fk_AluguelEquipamento_IdUnidade`;
ALTER TABLE `PessoaUnidade` DROP FOREIGN KEY `fk_PessoaUnidade_IdUnidade`;
ALTER TABLE `Cobranca` DROP FOREIGN KEY `fk_Cobranca_IdUnidade`;
ALTER TABLE `GuardaEncomenda` DROP FOREIGN KEY `fk_GuardaEncomenda_IdUnidade`;

ALTER TABLE `Unidade`
  MODIFY COLUMN `IdUnidade` INT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `Hidrometro` ADD CONSTRAINT `fk_Hidrometro_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `ConsumoAgua` ADD CONSTRAINT `fk_ConsumoAgua_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `AluguelEquipamento` ADD CONSTRAINT `fk_AluguelEquipamento_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `PessoaUnidade` ADD CONSTRAINT `fk_PessoaUnidade_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `Cobranca` ADD CONSTRAINT `fk_Cobranca_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT;
