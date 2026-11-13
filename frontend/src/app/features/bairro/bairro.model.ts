export interface Bairro {
  idBairro?: number;
  nome?: string;
  codigoIBGEMunicipio?: number;
  /** Preenchido pela API na listagem e na edição (JOIN com Município). */
  nomeMunicipio?: string;
}