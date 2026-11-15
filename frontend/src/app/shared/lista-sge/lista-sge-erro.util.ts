import { mensagemErroHttp } from '../../core/utils/http-error-message.util';

/** Estado de carregamento compartilhado das listagens lst-*. */
export interface EstadoCarregamentoLista {
  loading: boolean;
  erroCarregamento?: string | null;
}

export function iniciarCarregamentoLista(estado: EstadoCarregamentoLista): void {
  estado.loading = true;
  estado.erroCarregamento = null;
}

export function finalizarCarregamentoListaSucesso(estado: EstadoCarregamentoLista): void {
  estado.loading = false;
  estado.erroCarregamento = null;
}

export function finalizarCarregamentoListaErro(
  estado: EstadoCarregamentoLista,
  erro: unknown,
  fallback = 'Não foi possível carregar os registros. Tente novamente.'
): void {
  estado.loading = false;
  estado.erroCarregamento = mensagemErroHttp(erro, fallback);
}