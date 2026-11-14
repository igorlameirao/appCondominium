-- Validação pós-migração (somente leitura). USE appcondominium;
SELECT 'papelvinculo' AS tabela, COUNT(*) AS registros FROM papelvinculo;
SELECT 'pessoavinculo' AS tabela, COUNT(*) AS registros FROM pessoavinculo;
SELECT CodigoPapelVinculo, Descricao, EscopoPapel FROM papelvinculo ORDER BY CodigoPapelVinculo;

SELECT
  (SELECT COUNT(*) FROM pessoacondominio) AS legado_condominio,
  (SELECT COUNT(*) FROM pessoaunidade) AS legado_unidade,
  (SELECT COUNT(*) FROM pessoavinculo WHERE IdUnidade IS NULL) AS vinculos_condominio,
  (SELECT COUNT(*) FROM pessoavinculo WHERE IdUnidade IS NOT NULL) AS vinculos_unidade;

SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('pessoavinculo','fornecedor','despesa')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

SHOW CREATE TABLE fornecedor;