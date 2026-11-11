-- Bases já criadas antes do RBAC. CREATE TABLE IF NOT EXISTS do schema.sql não adiciona coluna nova.
-- Rode uma vez. Se IdPerfil já existir, ignore o erro do ALTER.

ALTER TABLE `PessoaCondominio`
  ADD COLUMN `IdPerfil` INT UNSIGNED NULL,
  ADD CONSTRAINT `fk_PessoaCondominio_IdPerfil` FOREIGN KEY (`IdPerfil`) REFERENCES `PerfilAcesso` (`IdPerfil`) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS `PermissionKey` (
  `IdPermissionKey` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Chave` VARCHAR(80) NOT NULL,
  `Nome` VARCHAR(150) NOT NULL,
  `Modulo` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`IdPermissionKey`),
  UNIQUE KEY `uq_PermissionKey_Chave` (`Chave`),
  KEY `idx_PermissionKey_Nome` (`Nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PerfilPermissao` (
  `IdPerfil` INT UNSIGNED NOT NULL,
  `IdPermissionKey` INT UNSIGNED NOT NULL,
  `Visualizar` TINYINT(1) NOT NULL,
  `Incluir` TINYINT(1) NOT NULL,
  `Alterar` TINYINT(1) NOT NULL,
  `Excluir` TINYINT(1) NOT NULL,
  PRIMARY KEY (`IdPerfil`, `IdPermissionKey`),
  CONSTRAINT `fk_PerfilPermissao_IdPerfil` FOREIGN KEY (`IdPerfil`) REFERENCES `PerfilAcesso` (`IdPerfil`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PerfilPermissao_IdPermissionKey` FOREIGN KEY (`IdPermissionKey`) REFERENCES `PermissionKey` (`IdPermissionKey`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PessoaPermissaoExcecao` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdPermissionKey` INT UNSIGNED NOT NULL,
  `Visualizar` TINYINT(1) NOT NULL,
  `Incluir` TINYINT(1) NOT NULL,
  `Alterar` TINYINT(1) NOT NULL,
  `Excluir` TINYINT(1) NOT NULL,
  PRIMARY KEY (`IdPessoa`, `IdCondominio`, `IdPermissionKey`),
  CONSTRAINT `fk_PessoaPermissaoExcecao_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaPermissaoExcecao_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaPermissaoExcecao_IdPermissionKey` FOREIGN KEY (`IdPermissionKey`) REFERENCES `PermissionKey` (`IdPermissionKey`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
