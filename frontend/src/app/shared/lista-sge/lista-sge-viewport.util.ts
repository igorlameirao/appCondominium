const TAMANHO_PAGINA_MIN = 3;
const TAMANHO_PAGINA_MAX = 200;
const ALTURA_LINHA_FALLBACK = 32;
const ALTURA_THEAD_FALLBACK = 34;

/** Chrome fixo do shell + cabeçalho/filtros/rodapé da listagem (antes da medição DOM). */
const CHROME_VIEWPORT_ESTIMADO_PX = 418;

export function estimarEspacoScrollViewport(): number {
  if (typeof window === 'undefined') return 0;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  return Math.max(0, vh - CHROME_VIEWPORT_ESTIMADO_PX);
}

export function estimarTamanhoPaginaInicial(): number {
  const espaco = estimarEspacoScrollViewport();
  return calcularCapacidadeLinhas(espaco, ALTURA_THEAD_FALLBACK, ALTURA_LINHA_FALLBACK);
}

export function estimarAlturaScrollMaxInicial(linhas: number): number | null {
  if (linhas <= 0) return null;
  const espaco = estimarEspacoScrollViewport();
  const capacidade = calcularCapacidadeLinhas(espaco, ALTURA_THEAD_FALLBACK, ALTURA_LINHA_FALLBACK);
  return calcularAlturaScrollMax(
    ALTURA_THEAD_FALLBACK,
    ALTURA_LINHA_FALLBACK,
    linhas,
    capacidade,
    espaco,
  );
}

export type MedicaoListaSgeViewport = {
  capacidade: number;
  alturaScrollMax: number | null;
  alturaLinha: number;
  alturaThead: number;
};

function alturaElemento(el: Element | null | undefined): number {
  if (!el) return 0;
  const html = el as HTMLElement;
  return html.offsetHeight || html.getBoundingClientRect().height;
}

/**
 * Soma alturas no painel exceto `.lst-tabela__scroll` (direto ou dentro de host de componente).
 * Não usar a altura do ancestral que envolve o scroll — isso incluiria a própria área rolável
 * no "chrome" e alimenta loop ResizeObserver ↔ max-height.
 */
function somarChromePainelExcetoScroll(painel: HTMLElement): number {
  const scroll = painel.querySelector('.lst-tabela__scroll');
  if (!scroll) {
    let total = 0;
    for (const filho of Array.from(painel.children)) {
      if (filho.classList.contains('lst-tabela__scroll')) continue;
      total += alturaElemento(filho);
    }
    return total;
  }

  let total = 0;
  const percorrer = (parent: Element): void => {
    for (const filho of Array.from(parent.children)) {
      if (filho === scroll) continue;
      if (filho.contains(scroll)) {
        percorrer(filho);
      } else {
        total += alturaElemento(filho);
      }
    }
  };
  percorrer(painel);
  return total;
}

/**
 * Calcula o espaço útil para a tabela da Central de Cobrança.
 * Não usa o topo do rodapé como limite inferior: com max-height já aplicado ao scroll,
 * o rodapé fica colado ao conteúdo e a medição antiga retornava ~1 linha (loop de capacidade).
 */
export function calcularEspacoScrollCentralCobranca(medidas: {
  scrollTop: number;
  limiteInferior: number;
  rodapeHeight: number;
  paddingPainelBottom: number;
  margemInferior: number;
}): number {
  const {
    scrollTop,
    limiteInferior,
    rodapeHeight,
    paddingPainelBottom,
    margemInferior,
  } = medidas;
  return Math.max(
    0,
    limiteInferior - scrollTop - rodapeHeight - paddingPainelBottom - margemInferior,
  );
}

/** Espaço vertical disponível para o corpo da tabela (inclui thead dentro do scroll). */
function medirEspacoScrollCentralCobranca(wrapper: HTMLElement): number {
  const scroll =
    (wrapper.querySelector(
      '.cc-col-principal .cc-card--pesquisa-resultado .lst-tabela__scroll, .cc-col-principal .cc-area-registros .lst-tabela__scroll',
    ) as HTMLElement | null) ??
    (wrapper.querySelector('.cc-col-principal .lst-tabela__scroll') as HTMLElement | null);
  if (!scroll) return 0;

  const scrollRect = scroll.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const coluna = scroll.closest('.cc-col-principal') as HTMLElement | null;
  const colunaBottom = coluna?.getBoundingClientRect().bottom ?? wrapperRect.bottom;
  const limiteInferior = Math.min(colunaBottom, wrapperRect.bottom);

  const painel = scroll.closest('.cc-card--tabela, .cc-card--pesquisa-resultado') as HTMLElement | null;
  const rodape = painel?.querySelector('.lst-rodape, .cc-rodape-tabela') as HTMLElement | null;
  const rodapeHeight = rodape ? rodape.getBoundingClientRect().height : 0;
  const paddingPainelBottom = painel
    ? parseFloat(getComputedStyle(painel).paddingBottom) || 0
    : 0;

  const ccPage = wrapper.querySelector('.cc-page') as HTMLElement | null;
  const margemInferior = ccPage ? parseFloat(getComputedStyle(ccPage).paddingBottom) || 0 : 0;

  return calcularEspacoScrollCentralCobranca({
    scrollTop: scrollRect.top,
    limiteInferior,
    rodapeHeight,
    paddingPainelBottom,
    margemInferior,
  });
}

export function medirEspacoScrollTabela(wrapper: HTMLElement): number {
  if (wrapper.classList.contains('cc-wrapper')) {
    return medirEspacoScrollCentralCobranca(wrapper);
  }

  const page = wrapper.querySelector('.lst-page') as HTMLElement | null;
  const painel = wrapper.querySelector('.lst-painel') as HTMLElement | null;
  if (!page || !painel) return 0;

  let chrome = 0;
  const cabecalho = page.querySelector(':scope > .lst-cabecalho');
  const contexto = page.querySelector(':scope > .lst-contexto');
  chrome += alturaElemento(cabecalho);
  chrome += alturaElemento(contexto);

  const pageStyle = getComputedStyle(page);
  chrome += parseFloat(pageStyle.paddingTop) + parseFloat(pageStyle.paddingBottom);

  chrome += somarChromePainelExcetoScroll(painel);

  return Math.max(0, wrapper.clientHeight - chrome);
}

export function medirAlturaThead(scroll: HTMLElement): number {
  const thead = scroll.querySelector('thead');
  if (thead) {
    const h = thead.getBoundingClientRect().height;
    if (h > 0) return h;
  }
  return ALTURA_THEAD_FALLBACK;
}

export function medirAlturaLinha(scroll: HTMLElement): number {
  const linha = scroll.querySelector('tbody tr') as HTMLElement | null;
  if (linha) {
    const h = linha.getBoundingClientRect().height;
    if (h > 0) return h;
  }
  const grade = scroll.querySelector('.lst-grade, .cc-grade');
  if (grade) {
    const font = parseFloat(getComputedStyle(grade).fontSize) || 13;
    const td = scroll.querySelector('td, th');
    if (td) {
      const style = getComputedStyle(td);
      const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      return Math.max(ALTURA_LINHA_FALLBACK, pad + font * 1.35);
    }
  }
  return ALTURA_LINHA_FALLBACK;
}

export function calcularCapacidadeLinhas(
  espacoScroll: number,
  alturaThead: number,
  alturaLinha: number,
): number {
  if (espacoScroll <= 0 || alturaLinha <= 0) return TAMANHO_PAGINA_MIN;
  const corpo = Math.max(0, espacoScroll - alturaThead);
  const linhas = Math.floor(corpo / alturaLinha);
  return Math.min(TAMANHO_PAGINA_MAX, Math.max(TAMANHO_PAGINA_MIN, linhas));
}

/**
 * Altura máxima do `.lst-tabela__scroll` para não esticar com poucos registros
 * e limitar ao teto útil quando há muitos.
 */
export function calcularAlturaScrollMax(
  alturaThead: number,
  alturaLinha: number,
  itensNaPagina: number,
  capacidade: number,
  espacoScroll: number,
): number | null {
  if (itensNaPagina <= 0) return null;

  const linhasVisiveis = Math.min(itensNaPagina, capacidade);
  const alturaConteudo = Math.ceil(alturaThead + linhasVisiveis * alturaLinha);
  const teto = espacoScroll > 0 ? Math.ceil(espacoScroll) : alturaConteudo;
  return Math.min(alturaConteudo, teto);
}

export function medirListaSgeViewport(
  wrapper: HTMLElement,
  itensNaPagina: number,
): MedicaoListaSgeViewport {
  const scroll =
    (wrapper.querySelector(
      '.cc-card--pesquisa-resultado .lst-tabela__scroll, .cc-area-registros .lst-tabela__scroll',
    ) as HTMLElement | null) ??
    (wrapper.querySelector('.lst-tabela__scroll, .cc-tabela__scroll') as HTMLElement | null);
  const espacoScroll = medirEspacoScrollTabela(wrapper);
  const alturaThead = scroll ? medirAlturaThead(scroll) : ALTURA_THEAD_FALLBACK;
  const alturaLinha = scroll ? medirAlturaLinha(scroll) : ALTURA_LINHA_FALLBACK;
  const capacidade = calcularCapacidadeLinhas(espacoScroll, alturaThead, alturaLinha);
  const alturaScrollMax = calcularAlturaScrollMax(
    alturaThead,
    alturaLinha,
    itensNaPagina,
    capacidade,
    espacoScroll,
  );

  return { capacidade, alturaScrollMax, alturaLinha, alturaThead };
}
