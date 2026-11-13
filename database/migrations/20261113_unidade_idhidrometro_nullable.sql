-- IdHidrometro em Unidade passa a ser opcional (tela de inclusão/edição de unidade).

ALTER TABLE `Unidade`
  MODIFY COLUMN `IdHidrometro` INT UNSIGNED NULL;
