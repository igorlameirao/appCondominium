export interface OfertaConcorrencia {
  idOfertaConcorrencia?: number;
  idFornecedor?: number;
  idCondominio?: number;
  idConcorrencia?: number;
  descricao?: string;
  documentoComprobatorio?: string;
  preco?: number;
  dataOferta?: string;
  dataValidade?: string;
  vencedora?: string;
  justificativa?: string;
  desistente?: string;
}