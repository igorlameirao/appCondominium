export interface EntradaSaidaMaterialConsumo {
  idEntradaSaidaMaterialConsumo?: number;
  idCondominio?: number;
  tipoLancamento?: number;
  idEstoqueMaterialConsumo?: number;
  idTipoMaterial?: number;
  dataValidade?: string;
  lote?: string;
  valorUnitarioAquisicao?: number;
  quantidade?: number;
  unidadeMedida?: number;
  idVinculo?: number;
}