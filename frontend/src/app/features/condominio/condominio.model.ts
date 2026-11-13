export interface Condominio {
  idCondominio?: number;
  nome?: string;
  enderecoLogradouro?: string;
  nomeBairro?: string;
  nomeMunicipio?: string;
  siglaUf?: string;
  idEndereco?: number;
  numeroEndereco?: number;
  complementoEndereco?: string;
  areaTerreno?: number;
  areaTotalEdificada?: number;
  areaTotalUnidades?: number;
  quantidadeTotalUnidades?: number;
  cNPJ?: string;
  dominio?: string;
  ativo?: number;
  dataInativacao?: string;
}