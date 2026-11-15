const formatador = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Exibe valor monetário com prefixo R$ e duas casas decimais. */
export function formatarMoedaExibir(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '';
  const numero = typeof valor === 'number' ? valor : parseNumeroMoeda(String(valor));
  if (numero === null || !Number.isFinite(numero)) return typeof valor === 'string' ? String(valor) : '';
  return formatador.format(numero);
}

/** Converte texto digitado ou vindo da API em número. */
export function parseNumeroMoeda(texto: string): number | null {
  const bruto = texto.trim();
  if (!bruto) return null;
  const soNumero = bruto
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(soNumero);
  return Number.isFinite(n) ? n : null;
}

export function moedaNumeroParaTextoApi(valor: number | null): string {
  if (valor === null) return '';
  return valor.toFixed(2);
}
