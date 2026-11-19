-- Preferências globais de notificação por pessoa (sem IdCondominio).
USE condominium;

CREATE TABLE IF NOT EXISTS `PessoaPreferenciaNotificacao` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `CodigoTipo` VARCHAR(60) NOT NULL,
  `AtivoPush` TINYINT(1) NOT NULL,
  `AtivoEmail` TINYINT(1) NOT NULL,
  `DataAtualizacao` DATETIME(6) NOT NULL,
  PRIMARY KEY (`IdPessoa`, `CodigoTipo`),
  CONSTRAINT `fk_PessoaPreferenciaNotificacao_IdPessoa`
    FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;