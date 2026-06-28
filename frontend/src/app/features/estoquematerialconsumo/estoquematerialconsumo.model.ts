export interface EstoqueMaterialConsumo {
  idEstoqueMaterialConsumo?: number;
  idCondominio?: number;
  idTipoMaterial?: number;
  dataValidade?: string;
  lote?: string;
  dataUltimaAquisicao?: string;
  valorUnitarioUltimaAquisicao?: number;
  valorUnitarioMedio?: number;
  quantidade?: number;
  valorTotal?: string;
  unidadeMedida?: number;
  idLocal?: number;
}