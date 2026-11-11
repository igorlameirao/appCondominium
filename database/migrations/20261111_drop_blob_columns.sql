-- Remove colunas binárias depois que os objetos existirem no S3.
-- Rode antes: dotnet run --project WebApi/AppCondominium.Tools -- migrate-blobs-to-s3 --drop-columns
-- Este script é o equivalente manual do passo --drop-columns (MySQL 8, colunas ainda presentes).

ALTER TABLE `pessoafisica` DROP COLUMN `Foto`;
ALTER TABLE `ConfiguracaoCondominio` DROP COLUMN `ImagemLogin`;
ALTER TABLE `ConfiguracaoCondominio` DROP COLUMN `ImagemIcone`;
ALTER TABLE `OfertaConcorrencia` DROP COLUMN `DocumentoComprobatorio`;
ALTER TABLE `PessoaUnidade` DROP COLUMN `Procuracao`;
