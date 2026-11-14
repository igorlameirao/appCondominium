export interface AutorizacaoAcessoTemporario {
  idAutorizacao?: number;
  idCondominio?: number;
  idUnidade?: number;
  idPessoaVisitante?: number;
  nomeVisitante?: string;
  documentoVisitante?: string;
  idPessoaAutorizador?: number;
  dataHoraInicio?: string;
  dataHoraFim?: string;
  tipoAcesso?: number;
  motivo?: string;
}