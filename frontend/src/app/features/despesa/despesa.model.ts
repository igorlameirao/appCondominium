export interface Despesa {
  idDespesa?: number;
  idFornecedor?: number;
  idCondominio?: number;
  idConcorrencia?: number;
  idTipoDespesa?: number;
  dataDespesa?: string;
  descricao?: string;
  dataLancamento?: string;
  valor?: number;
  observacoes?: string;
}