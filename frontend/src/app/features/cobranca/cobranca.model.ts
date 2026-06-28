export interface Cobranca {
  idCobranca?: number;
  idCondominio?: number;
  idArquivoCobrancaRetorno?: number;
  sequencialRegistroRetorno?: number;
  idArquivoCobrancaRemessa?: number;
  sequencialRegistroRemessa?: number;
  idUnidade?: number;
  dataGeracao?: string;
  dataVencimento?: string;
}