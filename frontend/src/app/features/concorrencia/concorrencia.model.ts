export interface Concorrencia {
  idConcorrencia?: number;
  idCondominio?: number;
  idTipoDespesa?: number;
  descricao?: string;
  tipoConcorrencia?: number;
  fase?: number;
  dataAbertura?: string;
  dataPrevistaEncerramento?: string;
  dataEncerramento?: string;
}