export interface ConfiguracaoCondominio {
  idConfiguracao?: number;
  idCondominio?: number;
  corPadrao?: string;
  /** Indicadores opcionais usados apenas na UI de preview de imagens. */
  temImagemLogin?: boolean;
  temImagemIcone?: boolean;
}