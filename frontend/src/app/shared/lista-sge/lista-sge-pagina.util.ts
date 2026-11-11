import { estimarTamanhoPaginaInicial } from './lista-sge-viewport.util';

/** Tamanho inicial alinhado à altura útil da viewport (evita 1ª carga com 10 linhas). */
export const TAMANHO_PAGINA_LISTA_PADRAO = estimarTamanhoPaginaInicial();

/** Estado mínimo de uma listagem SGE com paginação por API. */
export interface ListaComPaginaDinamica {
  pagina: number;
  total: number;
  tamanhoPagina: number;
  itens?: unknown[];
  carregar?: () => void;
}

/**
 * Aplica novo tamanho de página calculado pelo viewport.
 * Ajusta a página atual se ficar fora do intervalo e recarrega quando há `carregar`.
 */
export function ajustarTamanhoPaginaLista(ctx: ListaComPaginaDinamica, novo: number): void {
  if (!Number.isFinite(novo) || novo < 1) return;
  const tamanho = Math.floor(novo);
  const anterior = ctx.tamanhoPagina;
  if (tamanho === anterior) return;

  const maxPagina = Math.max(1, Math.ceil(ctx.total / tamanho) || 1);
  if (ctx.pagina > maxPagina) ctx.pagina = maxPagina;

  const itensCarregados = Array.isArray(ctx.itens) ? ctx.itens.length : 0;
  const precisaRecarregar =
    itensCarregados === 0 ||
    (tamanho < anterior) ||
    (tamanho > anterior && itensCarregados < tamanho);

  ctx.tamanhoPagina = tamanho;
  if (precisaRecarregar) ctx.carregar?.();
}

/** Apenas limita a página atual ao total (listas paginadas no cliente). */
export function ajustarPaginaAoTamanho(ctx: { pagina: number; total: number; tamanhoPagina: number }): void {
  const maxPagina = Math.max(1, Math.ceil(ctx.total / ctx.tamanhoPagina) || 1);
  if (ctx.pagina > maxPagina) ctx.pagina = maxPagina;
}
