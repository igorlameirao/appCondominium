-- AppCondominium schema gerado (PK, FK, UNIQUE, INDEX)
CREATE DATABASE IF NOT EXISTS appcondominium CHARACTER SET utf8mb4;
USE appcondominium;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `PerfilAcesso` (
  `IdPerfil` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Descricao` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`IdPerfil`),
  KEY `idx_PerfilAcesso_Descricao` (`Descricao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Administrador');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Síndico');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Subsíndico');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Conselheiro');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Funcionário Administração');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('funcionário Manutenção');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Proprietário');
INSERT IGNORE INTO `PerfilAcesso` (Descricao) VALUES ('Morador');
CREATE TABLE IF NOT EXISTS `UF` (
  `SiglaUF` CHAR(2) NOT NULL,
  `Estado` VARCHAR(150) NOT NULL,
  `CodigoIBGE` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`SiglaUF`),
  UNIQUE KEY `uq_UF_Estado` (`Estado`),
  UNIQUE KEY `uq_UF_CodigoIBGE` (`CodigoIBGE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Municipio` (
  `CodigoIBGEMunicipio` MEDIUMINT UNSIGNED NOT NULL,
  `Nome` VARCHAR(150) NOT NULL,
  `SiglaUF` CHAR(2) NOT NULL,
  PRIMARY KEY (`CodigoIBGEMunicipio`),
  UNIQUE KEY `uq_Municipio_Nome` (`Nome`),
  CONSTRAINT `fk_Municipio_SiglaUF` FOREIGN KEY (`SiglaUF`) REFERENCES `UF` (`SiglaUF`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Bairro` (
  `IdBairro` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Nome` VARCHAR(150) NOT NULL,
  `CodigoIBGEMunicipio` MEDIUMINT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdBairro`),
  KEY `idx_Bairro_Nome` (`Nome`),
  CONSTRAINT `fk_Bairro_CodigoIBGEMunicipio` FOREIGN KEY (`CodigoIBGEMunicipio`) REFERENCES `Municipio` (`CodigoIBGEMunicipio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Endereco` (
  `IdEndereco` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `CEP` CHAR(8) NOT NULL,
  `Logradouro` VARCHAR(100) NOT NULL,
  `IdBairro` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdEndereco`),
  KEY `idx_Endereco_CEP` (`CEP`),
  CONSTRAINT `fk_Endereco_IdBairro` FOREIGN KEY (`IdBairro`) REFERENCES `Bairro` (`IdBairro`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Condominio` (
  `IdCondominio` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Nome` VARCHAR(255) NOT NULL,
  `IdEndereco` INT UNSIGNED NOT NULL,
  `NumeroEndereco` INT UNSIGNED NOT NULL,
  `ComplementoEndereco` VARCHAR(255) NULL,
  `AreaTerreno` DECIMAL(10,3) UNSIGNED NOT NULL,
  `AreaTotalEdificada` DECIMAL(10,3) UNSIGNED NOT NULL,
  `AreaTotalUnidades` DECIMAL(10,3) UNSIGNED NULL,
  `QuantidadeTotalUnidades` INT UNSIGNED NULL,
  `CNPJ` CHAR(14) NULL,
  PRIMARY KEY (`IdCondominio`),
  UNIQUE KEY `uq_Condominio_Nome` (`Nome`),
  UNIQUE KEY `uq_Condominio_CNPJ` (`CNPJ`),
  CONSTRAINT `fk_Condominio_IdEndereco` FOREIGN KEY (`IdEndereco`) REFERENCES `Endereco` (`IdEndereco`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ConfiguracaoCondominio` (
  `IdConfiguracao` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `CorPadrao` CHAR(7) NULL,
  `ImagemLogin` MEDIUMBLOB NULL,
  `ImagemIcone` BLOB NULL,
  PRIMARY KEY (`IdConfiguracao`),
  CONSTRAINT `fk_ConfiguracaoCondominio_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Bloco` (
  `IdBloco` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Descricao` VARCHAR(100) NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdBloco`),
  CONSTRAINT `fk_Bloco_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `TipoUnidade` (
  `IdTipoUnidade` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  `QtdSalas` INT UNSIGNED NOT NULL,
  `QtdQuartos` INT UNSIGNED NOT NULL,
  `QtdSuites` INT UNSIGNED NOT NULL,
  `QtdBanheiros` INT UNSIGNED NOT NULL,
  `Area` DECIMAL(10,3) UNSIGNED NOT NULL,
  PRIMARY KEY (`IdTipoUnidade`),
  UNIQUE KEY `IdxCKTipoUnidade` (`IdCondominio`, `Descricao`),
  CONSTRAINT `fk_TipoUnidade_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Unidade` (
  `IdUnidade` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdBloco` INT UNSIGNED NOT NULL,
  `Numero` INT UNSIGNED NULL,
  `IdTipoUnidade` INT UNSIGNED NOT NULL,
  `IdHidrometro` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdUnidade`),
  CONSTRAINT `fk_Unidade_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Unidade_IdBloco` FOREIGN KEY (`IdBloco`) REFERENCES `Bloco` (`IdBloco`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Unidade_IdTipoUnidade` FOREIGN KEY (`IdTipoUnidade`) REFERENCES `TipoUnidade` (`IdTipoUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Unidade_IdHidrometro` FOREIGN KEY (`IdHidrometro`) REFERENCES `Hidrometro` (`IdHidrometro`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Hidrometro` (
  `IdHidrometro` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `NumeroSerie` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`IdHidrometro`),
  UNIQUE KEY `IdxCKHidrometro` (`IdCondominio`, `NumeroSerie`),
  CONSTRAINT `fk_Hidrometro_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Hidrometro_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ConsumoAgua` (
  `IdConsumo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `IdHidrometro` INT UNSIGNED NOT NULL,
  `DataLeitura` DATETIME NOT NULL,
  `LeituraHidrometro` INT UNSIGNED NOT NULL,
  `Consumo` INT UNSIGNED NULL,
  `MesReferencia` CHAR(7) NULL,
  PRIMARY KEY (`IdConsumo`),
  UNIQUE KEY `uq_ConsumoAgua_MesReferencia` (`MesReferencia`),
  UNIQUE KEY `IdxCKConsumoAgua` (`IdUnidade`, `MesReferencia`, `IdHidrometro`),
  CONSTRAINT `fk_ConsumoAgua_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ConsumoAgua_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ConsumoAgua_IdHidrometro` FOREIGN KEY (`IdHidrometro`) REFERENCES `Hidrometro` (`IdHidrometro`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Pessoa` (
  `IdPessoa` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `CPFCNPJ` VARCHAR(14) NOT NULL,
  `Nome` VARCHAR(255) NOT NULL,
  `Telefone` VARCHAR(15) NULL,
  PRIMARY KEY (`IdPessoa`),
  UNIQUE KEY `uq_Pessoa_CPFCNPJ` (`CPFCNPJ`),
  KEY `idx_Pessoa_Nome` (`Nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PessoaEndereco` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdEndereco` INT UNSIGNED NOT NULL,
  `NumeroEndereco` INT UNSIGNED NULL,
  `ComplementoEndereco` VARCHAR(100) NULL,
  `TipoEndereco` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdPessoa`, `IdEndereco`),
  CONSTRAINT `fk_PessoaEndereco_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaEndereco_IdEndereco` FOREIGN KEY (`IdEndereco`) REFERENCES `Endereco` (`IdEndereco`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pessoafisica` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `DataNascimento` DATE NOT NULL,
  `email` VARCHAR(255) NULL,
  `Senha` VARCHAR(60) NULL,
  `Foto` MEDIUMBLOB NULL,
  `FotoEmbedding` JSON NULL,
  PRIMARY KEY (`IdPessoa`),
  UNIQUE KEY `uq_pessoafisica_email` (`email`),
  KEY `idx_pessoafisica_DataNascimento` (`DataNascimento`),
  CONSTRAINT `fk_pessoafisica_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PessoaJuridica` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdResponsavel` INT UNSIGNED NOT NULL,
  `NomeFantasia` VARCHAR(255) NULL,
  `DataFundacao` DATE NULL,
  `InscricaoEstadual` VARCHAR(40) NULL,
  `InscricaoMunicipal` VARCHAR(40) NULL,
  PRIMARY KEY (`IdPessoa`),
  KEY `idx_PessoaJuridica_NomeFantasia` (`NomeFantasia`),
  CONSTRAINT `fk_PessoaJuridica_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaJuridica_IdResponsavel` FOREIGN KEY (`IdResponsavel`) REFERENCES `pessoafisica` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Fornecedor` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdPessoa`),
  CONSTRAINT `fk_Fornecedor_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `PessoaJuridica` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Fornecedor_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `TipoAtividadeEconomica` (
  `CodigoTipoAtividadeEconomica` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`CodigoTipoAtividadeEconomica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `AtividadeEconomica` (
  `CodigoTipoAtividadeEconomica` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`CodigoTipoAtividadeEconomica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `FornecedorAtividade` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `CodigoTipoAtividadeEconomica` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdPessoa`, `CodigoTipoAtividadeEconomica`),
  CONSTRAINT `fk_FornecedorAtividade_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `PessoaJuridica` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_FornecedorAtividade_CodigoTipoAtividadeEconomica` FOREIGN KEY (`CodigoTipoAtividadeEconomica`) REFERENCES `AtividadeEconomica` (`CodigoTipoAtividadeEconomica`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PessoaCondominio` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `DataInicio` DATE NOT NULL,
  `TipoVinculo` TINYINT UNSIGNED NOT NULL,
  `DataFim` DATE NULL,
  PRIMARY KEY (`IdPessoa`, `IdCondominio`),
  CONSTRAINT `fk_PessoaCondominio_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaCondominio_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Equipamento` (
  `IdEquipamento` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  `ValorAluguel` DECIMAL(10,2) UNSIGNED NOT NULL,
  `DuracaoHoras` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdEquipamento`),
  CONSTRAINT `fk_Equipamento_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `AluguelEquipamento` (
  `IdAluguelEquipamento` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `IdEquipamento` BIGINT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `DataInicio` DATETIME NULL,
  `DataFim` DATETIME NULL,
  `Valor` DECIMAL(10,2) UNSIGNED NULL,
  PRIMARY KEY (`IdAluguelEquipamento`),
  CONSTRAINT `fk_AluguelEquipamento_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_AluguelEquipamento_IdEquipamento` FOREIGN KEY (`IdEquipamento`) REFERENCES `Equipamento` (`IdEquipamento`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_AluguelEquipamento_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PessoaUnidade` (
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `DataInicio` DATE NOT NULL,
  `DataFim` DATE NULL,
  `TipoVinculo` TINYINT UNSIGNED NOT NULL,
  `Resposavel` TINYINT(1) NOT NULL,
  `Procuracao` BLOB NULL,
  PRIMARY KEY (`IdPessoa`, `IdUnidade`),
  CONSTRAINT `fk_PessoaUnidade_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_PessoaUnidade_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Concorrencia` (
  `IdConcorrencia` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `idTipoDespesa` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NULL,
  `TipoConcorrencia` TINYINT UNSIGNED NOT NULL,
  `Fase` TINYINT UNSIGNED NOT NULL,
  `DataAbertura` DATETIME NOT NULL,
  `DataPrevistaEncerramento` DATETIME NOT NULL,
  `DataEncerramento` DATETIME NULL,
  PRIMARY KEY (`IdConcorrencia`),
  KEY `idx_Concorrencia_DataAbertura` (`DataAbertura`),
  KEY `idx_Concorrencia_DataPrevistaEncerramento` (`DataPrevistaEncerramento`),
  KEY `idx_Concorrencia_DataEncerramento` (`DataEncerramento`),
  CONSTRAINT `fk_Concorrencia_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Concorrencia_idTipoDespesa` FOREIGN KEY (`idTipoDespesa`) REFERENCES `TipoDespesa` (`idTipoDespesa`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `TipoDespesa` (
  `idTipoDespesa` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  `TipoRateio` CHAR(1) NOT NULL,
  `CodigoContabil` VARCHAR(50) NULL,
  PRIMARY KEY (`idTipoDespesa`),
  CONSTRAINT `fk_TipoDespesa_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Despesa` (
  `IdDespesa` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdFornecedor` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdConcorrencia` INT UNSIGNED NULL,
  `idTipoDespesa` INT UNSIGNED NOT NULL,
  `DataDespesa` DATE NOT NULL,
  `Descricao` VARCHAR(255) NOT NULL,
  `DataLancamento` DATETIME NOT NULL,
  `Valor` DECIMAL(10,2) UNSIGNED NOT NULL,
  `Observacoes` VARCHAR(255) NULL,
  PRIMARY KEY (`IdDespesa`),
  CONSTRAINT `fk_Despesa_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `Fornecedor` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Despesa_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Despesa_IdConcorrencia` FOREIGN KEY (`IdConcorrencia`) REFERENCES `Concorrencia` (`IdConcorrencia`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Despesa_idTipoDespesa` FOREIGN KEY (`idTipoDespesa`) REFERENCES `TipoDespesa` (`idTipoDespesa`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `OfertaConcorrencia` (
  `IdOfertaConcorrencia` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdFornecedor` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdConcorrencia` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(255) NULL,
  `DocumentoComprobatorio` BLOB NULL,
  `Preco` DECIMAL(10,2) UNSIGNED NOT NULL,
  `DataOferta` DATE NOT NULL,
  `DataValidade` DATE NOT NULL,
  `Vencedora` TINYINT(1) NULL,
  `Justificativa` VARCHAR(255) NULL,
  `Desistente` TINYINT(1) NULL,
  PRIMARY KEY (`IdOfertaConcorrencia`),
  KEY `idx_OfertaConcorrencia_DataValidade` (`DataValidade`),
  CONSTRAINT `fk_OfertaConcorrencia_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `Fornecedor` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_OfertaConcorrencia_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_OfertaConcorrencia_IdConcorrencia` FOREIGN KEY (`IdConcorrencia`) REFERENCES `Concorrencia` (`IdConcorrencia`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Banco` (
  `CodigoBanco` INT UNSIGNED NOT NULL,
  `DigitoVerificador` INT UNSIGNED NOT NULL,
  `Nome` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`CodigoBanco`),
  UNIQUE KEY `uq_Banco_Nome` (`Nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `DadosBancarios` (
  `Conta` INT UNSIGNED NOT NULL,
  `CodigoBanco` INT UNSIGNED NOT NULL,
  `Agencia` CHAR(4) NOT NULL,
  `DigitoAgencia` CHAR(1) NULL,
  `DigitoConta` CHAR(1) NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `Ativo` TINYINT(1) NOT NULL,
  `DataCadastro` DATETIME NOT NULL,
  `CodigoEmpresaCobranca` INT UNSIGNED NULL,
  PRIMARY KEY (`Conta`, `CodigoBanco`, `Agencia`),
  CONSTRAINT `fk_DadosBancarios_CodigoBanco` FOREIGN KEY (`CodigoBanco`) REFERENCES `Banco` (`CodigoBanco`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_DadosBancarios_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Cobranca` (
  `IdCobranca` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdArquivoCobrancaRetorno` INT UNSIGNED NULL,
  `SequencialRegistroRetorno` INT UNSIGNED NULL,
  `IdArquivoCobrancaRemessa` INT UNSIGNED NULL,
  `SequencialRegistroRemessa` INT UNSIGNED NULL,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `DataGeracao` DATE NULL,
  `DataVencimento` DATE NULL,
  PRIMARY KEY (`IdCobranca`),
  KEY `idx_Cobranca_SequencialRegistroRetorno` (`SequencialRegistroRetorno`),
  KEY `idx_Cobranca_SequencialRegistroRemessa` (`SequencialRegistroRemessa`),
  CONSTRAINT `fk_Cobranca_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Cobranca_IdArquivoCobrancaRemessa` FOREIGN KEY (`IdArquivoCobrancaRemessa`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Cobranca_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `CobrancaDetalhe` (
  `IdCobrancaDetalhe` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdAluguelEquipamento` INT UNSIGNED NULL,
  `IdDespesa` BIGINT UNSIGNED NULL,
  `IdCobranca` BIGINT UNSIGNED NULL,
  `Descricao` VARCHAR(255) NULL,
  `Valor` DECIMAL(10,2) UNSIGNED NOT NULL,
  PRIMARY KEY (`IdCobrancaDetalhe`),
  CONSTRAINT `fk_CobrancaDetalhe_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_CobrancaDetalhe_IdAluguelEquipamento` FOREIGN KEY (`IdAluguelEquipamento`) REFERENCES `AluguelEquipamento` (`IdAluguelEquipamento`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_CobrancaDetalhe_IdDespesa` FOREIGN KEY (`IdDespesa`) REFERENCES `Despesa` (`IdDespesa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_CobrancaDetalhe_IdCobranca` FOREIGN KEY (`IdCobranca`) REFERENCES `Cobranca` (`IdCobranca`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `GuardaEncomenda` (
  `IdGuardaEncomenda` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdUnidade` INT UNSIGNED NOT NULL,
  `CodigoEncomenda` VARCHAR(255) NOT NULL,
  `IdLocal` INT UNSIGNED NULL,
  `DataHoraEntrada` DATETIME NOT NULL,
  `DataHoraSaida` DATETIME NULL,
  `IdPessoaEntrada` INT UNSIGNED NOT NULL,
  `IdPessoaSaida` INT UNSIGNED NULL,
  PRIMARY KEY (`IdGuardaEncomenda`),
  KEY `idx_GuardaEncomenda_CodigoEncomenda` (`CodigoEncomenda`),
  KEY `idx_GuardaEncomenda_DataHoraEntrada` (`DataHoraEntrada`),
  CONSTRAINT `fk_GuardaEncomenda_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_GuardaEncomenda_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_GuardaEncomenda_IdLocal` FOREIGN KEY (`IdLocal`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_GuardaEncomenda_IdPessoaEntrada` FOREIGN KEY (`IdPessoaEntrada`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_GuardaEncomenda_IdPessoaSaida` FOREIGN KEY (`IdPessoaSaida`) REFERENCES `PessoaUnidade` (`IdPessoa`, `IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Local` (
  `IdLocal` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `Descricao` VARCHAR(100) NOT NULL,
  `IdLocalPai` INT UNSIGNED NULL,
  `TipoLocal` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdLocal`),
  KEY `idx_Local_Descricao` (`Descricao`),
  CONSTRAINT `fk_Local_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Local_IdLocalPai` FOREIGN KEY (`IdLocalPai`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `TipoMaterial` (
  `IdTipoMaterial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Descricao` VARCHAR(100) NOT NULL,
  `Classificacao` TINYINT UNSIGNED NULL,
  PRIMARY KEY (`IdTipoMaterial`),
  UNIQUE KEY `uq_TipoMaterial_Descricao` (`Descricao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `TipoMaterialCondominio` (
  `IdTipoMaterial` INT UNSIGNED NOT NULL,
  `IdCondominio` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdTipoMaterial`, `IdCondominio`),
  CONSTRAINT `fk_TipoMaterialCondominio_IdTipoMaterial` FOREIGN KEY (`IdTipoMaterial`) REFERENCES `TipoMaterial` (`IdTipoMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_TipoMaterialCondominio_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Material` (
  `IdMaterial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `DataAquisicao` DATE NOT NULL,
  `Patrimonio` VARCHAR(30) NOT NULL,
  `Descricao` VARCHAR(255) NULL,
  `IdTipoMaterial` INT UNSIGNED NOT NULL,
  `VidaUtil` INT UNSIGNED NOT NULL,
  `ValorAquisicao` VARCHAR(255) NULL,
  `ValorDepreciavel` VARCHAR(255) NULL,
  `ValorDepreciacao` VARCHAR(255) NULL,
  `ValorQuotaDepreciacao` VARCHAR(255) NULL,
  `ValorContabil` VARCHAR(255) NULL,
  PRIMARY KEY (`IdMaterial`),
  UNIQUE KEY `uq_Material_Patrimonio` (`Patrimonio`),
  KEY `idx_Material_DataAquisicao` (`DataAquisicao`),
  KEY `idx_Material_Descricao` (`Descricao`),
  CONSTRAINT `fk_Material_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_Material_IdTipoMaterial` FOREIGN KEY (`IdTipoMaterial`) REFERENCES `TipoMaterial` (`IdTipoMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `AlocacaoMaterial` (
  `IdAlocacaoMaterial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdMaterial` INT UNSIGNED NOT NULL,
  `IdPessoa` INT UNSIGNED NOT NULL,
  `IdLocal` INT UNSIGNED NOT NULL,
  `DataHoraInicio` DATETIME NOT NULL,
  `DataHoraFim` DATETIME NULL,
  PRIMARY KEY (`IdAlocacaoMaterial`),
  KEY `idx_AlocacaoMaterial_DataHoraInicio` (`DataHoraInicio`),
  KEY `idx_AlocacaoMaterial_DataHoraFim` (`DataHoraFim`),
  CONSTRAINT `fk_AlocacaoMaterial_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_AlocacaoMaterial_IdMaterial` FOREIGN KEY (`IdMaterial`) REFERENCES `Material` (`IdMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_AlocacaoMaterial_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `PessoaCondominio` (`IdPessoa`, `IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_AlocacaoMaterial_IdLocal` FOREIGN KEY (`IdLocal`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `EstoqueMaterialConsumo` (
  `IdEstoqueMaterialConsumo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `IdTipoMaterial` INT UNSIGNED NOT NULL,
  `DataValidade` DATETIME NULL,
  `Lote` VARCHAR(20) NULL,
  `DataUltimaAquisicao` DATETIME NOT NULL,
  `ValorUnitarioUltimaAquisicao` VARCHAR(255) NULL,
  `ValorUnitarioMedio` VARCHAR(255) NULL,
  `Quantidade` VARCHAR(255) NULL,
  `ValorTotal` VARCHAR(255) NULL,
  `UnidadeMedida` TINYINT UNSIGNED NOT NULL,
  `IdLocal` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`IdEstoqueMaterialConsumo`),
  KEY `idx_EstoqueMaterialConsumo_DataValidade` (`DataValidade`),
  KEY `idx_EstoqueMaterialConsumo_Lote` (`Lote`),
  KEY `idx_EstoqueMaterialConsumo_DataUltimaAquisicao` (`DataUltimaAquisicao`),
  CONSTRAINT `fk_EstoqueMaterialConsumo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_EstoqueMaterialConsumo_IdTipoMaterial` FOREIGN KEY (`IdTipoMaterial`) REFERENCES `TipoMaterial` (`IdTipoMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_EstoqueMaterialConsumo_IdLocal` FOREIGN KEY (`IdLocal`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `EntradaSaidaMaterialConsumo` (
  `IdEntradaSaidaMaterialConsumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `IdCondominio` INT UNSIGNED NOT NULL,
  `TipoLancamento` TINYINT UNSIGNED NOT NULL,
  `IdEstoqueMaterialConsumo` BIGINT UNSIGNED NOT NULL,
  `IdTipoMaterial` INT UNSIGNED NOT NULL,
  `DataValidade` DATETIME NULL,
  `Lote` VARCHAR(20) NULL,
  `ValorUnitarioAquisicao` VARCHAR(255) NULL,
  `Quantidade` VARCHAR(255) NULL,
  `UnidadeMedida` TINYINT UNSIGNED NOT NULL,
  `IdPessoa` INT UNSIGNED NULL,
  PRIMARY KEY (`IdEntradaSaidaMaterialConsumo`),
  KEY `idx_EntradaSaidaMaterialConsumo_IdEstoqueMaterialConsumo` (`IdEstoqueMaterialConsumo`),
  KEY `idx_EntradaSaidaMaterialConsumo_DataValidade` (`DataValidade`),
  KEY `idx_EntradaSaidaMaterialConsumo_Lote` (`Lote`),
  CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdTipoMaterial` FOREIGN KEY (`IdTipoMaterial`) REFERENCES `TipoMaterial` (`IdTipoMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `PessoaCondominio` (`IdPessoa`, `IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
