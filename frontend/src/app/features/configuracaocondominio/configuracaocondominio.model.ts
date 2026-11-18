export interface ConfiguracaoCondominio {
  idConfiguracao?: number;
  idCondominio?: number;
  corPadrao?: string;
  /** null = padrão do sistema (24 meses na leitura efetiva); 0 = indeterminado; > 0 = meses. */
  retencaoHistoricoEncomendasMeses?: number | null;
  /** null = padrão do sistema (3 meses na leitura efetiva); 0 = indeterminado; > 0 = meses. */
  retencaoFotosEncomendasMeses?: number | null;
  /** Indicadores opcionais usados apenas na UI de preview de imagens. */
  temImagemLogin?: boolean;
  temImagemIcone?: boolean;
  /** Preenchido na listagem — não persiste na API. */
  nomeCondominio?: string;
}

/** Sentinela no select: gravar null (padrão do sistema). */
export const RETENCAO_PADRAO_SISTEMA = -1;

export const RETENCAO_MESES_OPCOES = [3, 6, 12, 18, 24, 36, 48, 60, 120] as const;

export const RETENCAO_PADRAO_HISTORICO_MESES = 24;
export const RETENCAO_PADRAO_FOTOS_MESES = 3;