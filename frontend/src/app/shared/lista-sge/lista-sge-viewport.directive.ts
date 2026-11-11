import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { TAMANHO_PAGINA_LISTA_PADRAO } from './lista-sge-pagina.util';
import {
  calcularAlturaScrollMax,
  estimarAlturaScrollMaxInicial,
  estimarTamanhoPaginaInicial,
  medirEspacoScrollTabela,
  medirListaSgeViewport,
} from './lista-sge-viewport.util';

/**
 * Recalcula tamanho de página e altura máxima da tabela conforme a área útil do shell.
 * Colocar no `.content-wrapper.lst-wrapper` da listagem.
 */
@Directive({
  selector: '.lst-wrapper[lstSgeViewport]',
  standalone: true,
})
export class ListaSgeViewport implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  @Input() tamanhoPagina = TAMANHO_PAGINA_LISTA_PADRAO;
  @Output() tamanhoPaginaChange = new EventEmitter<number>();

  @Input() totalItens = 0;
  @Input() itensNaPagina = 0;
  @Input() filtrosRecolhidos = false;

  /** Quando false, só ajusta altura visual (ex.: grade de horários sem API paginada). */
  @Input() paginacaoApi = true;

  private observer: ResizeObserver | null = null;
  private filtroObserver: MutationObserver | null = null;
  private frame = 0;
  private ultimaCapacidade = -1;

  ngOnInit(): void {
    this.aplicarEstimativaScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtrosRecolhidos'] && !changes['filtrosRecolhidos'].firstChange) {
      this.agendarMedicao();
    }
    if (changes['itensNaPagina'] || changes['totalItens'] || changes['tamanhoPagina']) {
      if (changes['itensNaPagina']?.firstChange || changes['tamanhoPagina']?.firstChange) {
        this.aplicarEstimativaScroll();
      } else {
        this.agendarMedicao();
      }
    }
  }

  ngAfterViewInit(): void {
    this.aplicarEstimativaScroll();
    this.configurarObservadores();
    this.medir();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.filtroObserver?.disconnect();
    if (this.frame) cancelAnimationFrame(this.frame);
    visualViewport?.removeEventListener('resize', this.onViewportResize);
    window.removeEventListener('resize', this.onViewportResize);
  }

  private configurarObservadores(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.agendarMedicao());
      this.observer.observe(this.host);
      const painel = this.host.querySelector('.lst-painel');
      if (painel) this.observer.observe(painel);
      const page = this.host.querySelector('.lst-page, .cc-page');
      if (page) this.observer.observe(page);
      const ccTabela = this.host.querySelector('.cc-card--tabela, .cc-card--pesquisa-resultado');
      if (ccTabela) this.observer.observe(ccTabela);
    }

    const filtros = this.host.querySelector('.lst-filtros');
    if (filtros && typeof MutationObserver !== 'undefined') {
      this.filtroObserver = new MutationObserver(() => this.agendarMedicao());
      this.filtroObserver.observe(filtros, { childList: true, subtree: true, attributes: true });
    }

    visualViewport?.addEventListener('resize', this.onViewportResize);
    window.addEventListener('resize', this.onViewportResize);
  }

  private readonly onViewportResize = () => this.agendarMedicao();

  private agendarMedicao(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.medir();
    });
  }

  private linhasParaAlturaScroll(): number {
    if (this.itensNaPagina > 0) return this.itensNaPagina;
    if (!this.paginacaoApi) return 0;
    return Math.max(this.tamanhoPagina, estimarTamanhoPaginaInicial());
  }

  private aplicarEstimativaScroll(): void {
    const linhas = this.linhasParaAlturaScroll();
    if (linhas <= 0) {
      this.host.style.removeProperty('--lst-scroll-max-altura-estimada');
      return;
    }

    const altura = estimarAlturaScrollMaxInicial(linhas);
    if (altura != null) {
      const valor = `${altura}px`;
      if (this.host.style.getPropertyValue('--lst-scroll-max-altura-estimada') !== valor) {
        this.host.style.setProperty('--lst-scroll-max-altura-estimada', valor);
      }
    }
  }

  private medir(): void {
    const linhasReferencia = this.linhasParaAlturaScroll();
    const medicao = medirListaSgeViewport(this.host, linhasReferencia);

    if (linhasReferencia > 0) {
      const espacoScroll = medirEspacoScrollTabela(this.host);
      let alturaScrollMax = calcularAlturaScrollMax(
        medicao.alturaThead,
        medicao.alturaLinha,
        linhasReferencia,
        medicao.capacidade,
        espacoScroll,
      );
      if (this.host.classList.contains('cc-wrapper') && espacoScroll > 0) {
        alturaScrollMax = Math.ceil(espacoScroll);
      }
      if (alturaScrollMax != null) {
        const valor = `${alturaScrollMax}px`;
        if (this.host.style.getPropertyValue('--lst-scroll-max-altura') !== valor) {
          this.host.style.setProperty('--lst-scroll-max-altura', valor);
        }
      }
    } else {
      if (this.host.style.getPropertyValue('--lst-scroll-max-altura')) {
        this.host.style.removeProperty('--lst-scroll-max-altura');
      }
      if (this.host.style.getPropertyValue('--lst-scroll-max-altura-estimada')) {
        this.host.style.removeProperty('--lst-scroll-max-altura-estimada');
      }
    }

    if (!this.paginacaoApi) return;

    const capacidade = medicao.capacidade;
    if (capacidade !== this.ultimaCapacidade) {
      this.ultimaCapacidade = capacidade;
      if (capacidade !== this.tamanhoPagina) {
        this.tamanhoPaginaChange.emit(capacidade);
      }
    }
  }
}
