export interface ConsumoAgua {
  idConsumo?: number;
  idCondominio?: number;
  idUnidade?: number;
  idHidrometro?: number;
  dataLeitura?: string;
  leituraHidrometro?: number;
  consumo?: number;
  mesReferencia?: string;
}