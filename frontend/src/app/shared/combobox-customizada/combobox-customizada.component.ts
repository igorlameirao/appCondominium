import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ComboboxOption {
  value: number | string;
  label: string;
}

const MARGEM = 4;
const ALTURA_MAX_PAINEL = 320;
const MIN_ESPACO_ABAIXO = 180;

/** RT-Gerais 07 — combobox digitável com filtro e paginação (layout SGE). */
@Component({
  selector: 'app-combobox-customizada',
  standalone: true,
  imports: [CommonModule, FormsModule, NgStyle],
  host: { style: 'display:block;width:100%;max-width:100%' },
  template: `
    <div
      class="combo"
      [class.aberto]="open"
      [class.desabilitado]="disabled"
      [class.combo--invalido]="invalido"
      [class.combo--acima]="abreAcima">
      <div class="combo-display" #display>
        <input
          type="text"
          class="combo-input"
          [id]="inputId || null"
          [(ngModel)]="search"
          (focus)="abrir()"
          (blur)="onInputBlur()"
          (input)="onSearch()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [attr.aria-label]="ariaLabel || null"
          autocomplete="off" />
        <button
          type="button"
          class="combo-clear"
          *ngIf="allowClear && value != null && value !== '' && !disabled"
          (mousedown)="$event.preventDefault()"
          (click)="clear()"
          tabindex="-1"
          aria-label="Limpar">×</button>
        <span class="combo-seta" aria-hidden="true">▼</span>
      </div>
      @if (open && !disabled) {
        <div class="combo-panel" #painel [ngStyle]="painelEstilo" (mousedown)="aoPressionarPainel($event)">
          <div class="combo-lista">
            @for (o of visibleOptions; track o.value) {
              <button
                type="button"
                class="combo-item"
                [class.selecionado]="selecionado(o)"
                (mousedown)="$event.preventDefault(); select(o)">{{ o.label }}</button>
            }
            @if (!visibleOptions.length) {
              <div class="combo-vazio">{{ mensagemListaVazia }}</div>
            }
          </div>
          @if (totalPages > 1) {
            <div class="combo-page">
              <button type="button" [disabled]="page <= 1" (mousedown)="$event.preventDefault()" (click)="prev()">« Anterior</button>
              <span>Página {{ page }} de {{ totalPages }}</span>
              <button type="button" [disabled]="page >= totalPages" (mousedown)="$event.preventDefault()" (click)="next()">Próxima »</button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ComboboxCustomizadaComponent implements OnChanges, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cd = inject(ChangeDetectorRef);

  @Input() options: ComboboxOption[] = [];
  @Input() value: number | string | null | undefined = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() placeholder = 'Selecione...';
  @Input() pageSize = 15;
  /** Quando true, não filtra localmente; `options` vêm do pai (ex.: busca na API). */
  @Input() remoteSearch = false;
  /** Com `remoteSearch`, só exibe a lista após esta quantidade de caracteres digitados. */
  @Input() minSearchLength = 0;
  @Input() inputId = '';
  @Input() ariaLabel = '';
  @Input() emptyMessage = 'Nenhum registro';
  @Input() minLengthMessage = 'Digite ao menos {n} letras.';
  /** Exibe o botão × para limpar a seleção (desligar em troca de contexto obrigatória). */
  @Input() allowClear = true;
  /** Aceita o texto digitado quando não houver opção correspondente (ex.: novo bairro). */
  @Input() aceitarTextoLivre = false;
  @Output() valueChange = new EventEmitter<number | string | null>();
  @Output() blurCommit = new EventEmitter<number | string | null>();
  @Output() searchChange = new EventEmitter<string>();

  @ViewChild('display') display?: ElementRef<HTMLElement>;
  @ViewChild('painel') painel?: ElementRef<HTMLElement>;

  search = '';
  open = false;
  abreAcima = false;
  painelEstilo: Record<string, string> = {};
  page = 1;
  filtered: ComboboxOption[] = [];
  /** Após abrir, o primeiro input do usuário passa a filtrar localmente. */
  private filtrarPorTexto = false;
  /**
   * Clique na barra de rolagem tira o foco do input. Sem isso a lista recolhe
   * antes do arraste; preventDefault na barra impede o próprio arraste.
   */
  private preservarAbertura = false;
  /** Blur ocorrido durante a rolagem: confirma o valor só quando a lista fechar de fato. */
  private blurAdiado = false;
  private recolocandoFoco = false;
  private reposicaoLigada = false;

  private readonly aoReposicionar = (evento?: Event) => {
    if (!this.open) return;
    const alvo = evento?.target;
    if (alvo instanceof Node && this.painel?.nativeElement.contains(alvo)) return;
    this.posicionarPainel();
  };

  private readonly aoSoltarPonteiro = () => {
    if (!this.preservarAbertura) return;
    setTimeout(() => this.retomarFocoAposRolagem());
  };

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get visibleOptions(): ComboboxOption[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get invalido(): boolean {
    if (this.disabled) return false;
    const vazio = this.value == null || this.value === '';
    return this.required && vazio;
  }

  get mensagemListaVazia(): string {
    const q = this.search.trim();
    if (this.minSearchLength > 0 && q.length > 0 && q.length < this.minSearchLength) {
      return this.minLengthMessage.replace('{n}', String(this.minSearchLength));
    }
    return this.emptyMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) this.syncSearchFromValue();
    if (changes['options']) {
      this.atualizarRotuloDaSelecao();
      this.aplicarFiltroOpcoes();
    }
  }

  ngOnDestroy(): void {
    this.desligarReposicaoViewport();
  }

  @HostListener('document:mousedown', ['$event'])
  aoClicarFora(event: MouseEvent): void {
    if (!this.open) return;
    const alvo = event.target as Node | null;
    if (alvo && this.host.nativeElement.contains(alvo)) return;
    if (this.pontoDentroDoPainel(event)) {
      this.preservarAbertura = true;
      return;
    }
    this.fechar();
  }

  @HostListener('keydown.escape')
  aoEsc(): void {
    if (this.open) this.fechar();
  }

  abrir(): void {
    if (this.recolocandoFoco) {
      this.recolocandoFoco = false;
      return;
    }
    if (this.disabled) return;
    this.open = true;
    this.filtrarPorTexto = false;
    if (!this.remoteSearch) {
      this.filtered = [...this.options];
      this.page = 1;
    } else {
      this.aplicarFiltroOpcoes();
    }
    this.ligarReposicaoViewport();
    this.cd.detectChanges();
    this.posicionarPainel();
    setTimeout(() => {
      this.posicionarPainel();
      if (!this.allowClear) {
        const input = this.display?.nativeElement?.querySelector('input') as HTMLInputElement | null;
        input?.select();
      }
    });
  }

  fechar(): void {
    const confirmar = this.blurAdiado;
    this.open = false;
    this.abreAcima = false;
    this.painelEstilo = {};
    this.preservarAbertura = false;
    this.blurAdiado = false;
    this.desligarReposicaoViewport();
    if (confirmar) {
      this.commitSearchToValue();
      this.blurCommit.emit(this.value ?? null);
    }
  }

  /** Mantém o painel aberto ao usar a barra; nos demais cliques evita o blur do input. */
  aoPressionarPainel(event: MouseEvent): void {
    if (this.cliqueMantemLista(event)) {
      this.preservarAbertura = true;
      return;
    }
    event.preventDefault();
  }

  onSearch(): void {
    this.filtrarPorTexto = true;
    this.aplicarFiltroOpcoes();
    this.searchChange.emit(this.search);
    if (this.value != null && this.value !== '') {
      const found = this.options.find(o => o.value == this.value);
      if (!found || found.label !== this.search) {
        this.value = null;
        this.valueChange.emit(null);
      }
    }
    if (this.open) {
      this.cd.detectChanges();
      this.posicionarPainel();
    }
  }

  selecionado(o: ComboboxOption): boolean {
    return this.value != null && this.value == o.value;
  }

  select(o: ComboboxOption): void {
    this.value = o.value;
    this.search = o.label;
    this.valueChange.emit(o.value);
    this.fechar();
  }

  onInputBlur(): void {
    const rolando = this.preservarAbertura;
    setTimeout(() => {
      if ((rolando || this.preservarAbertura) && this.open) {
        this.blurAdiado = true;
        return;
      }
      this.blurAdiado = true;
      this.fechar();
    }, 0);
  }

  clear(): void {
    this.value = null;
    this.search = '';
    this.valueChange.emit(null);
    this.onSearch();
  }

  prev(): void {
    if (this.page > 1) this.page--;
  }

  next(): void {
    if (this.page < this.totalPages) this.page++;
  }

  private posicionarPainel(): void {
    const trigger = this.display?.nativeElement;
    if (!trigger || !this.open) return;

    const rect = trigger.getBoundingClientRect();
    const espacoAbaixo = window.innerHeight - rect.bottom - MARGEM;
    const espacoAcima = rect.top - MARGEM;
    this.abreAcima = espacoAbaixo < MIN_ESPACO_ABAIXO && espacoAcima > espacoAbaixo;

    const disponivel = Math.max(120, this.abreAcima ? espacoAcima : espacoAbaixo);
    const maxAltura = Math.min(ALTURA_MAX_PAINEL, disponivel);
    const largura = Math.max(rect.width, 220);

    this.painelEstilo = {
      position: 'fixed',
      left: `${Math.min(rect.left, window.innerWidth - largura - MARGEM)}px`,
      right: 'auto',
      width: `${largura}px`,
      maxHeight: `${maxAltura}px`,
      zIndex: '2000',
      ...(this.abreAcima
        ? { top: 'auto', bottom: `${window.innerHeight - rect.top + MARGEM}px` }
        : { top: `${rect.bottom + MARGEM}px`, bottom: 'auto' }),
    };
    this.cd.detectChanges();
  }

  private ligarReposicaoViewport(): void {
    if (this.reposicaoLigada) return;
    this.reposicaoLigada = true;
    window.addEventListener('resize', this.aoReposicionar);
    window.addEventListener('scroll', this.aoReposicionar, true);
    window.addEventListener('mouseup', this.aoSoltarPonteiro);
  }

  private desligarReposicaoViewport(): void {
    if (!this.reposicaoLigada) return;
    this.reposicaoLigada = false;
    window.removeEventListener('resize', this.aoReposicionar);
    window.removeEventListener('scroll', this.aoReposicionar, true);
    window.removeEventListener('mouseup', this.aoSoltarPonteiro);
  }

  private retomarFocoAposRolagem(): void {
    if (!this.open) {
      this.preservarAbertura = false;
      return;
    }
    this.preservarAbertura = false;
    const input = this.display?.nativeElement?.querySelector('input') as HTMLInputElement | null;
    if (!input || document.activeElement === input) {
      this.blurAdiado = false;
      return;
    }
    this.recolocandoFoco = true;
    input.focus({ preventScroll: true });
    if (document.activeElement === input) {
      this.blurAdiado = false;
      return;
    }
    this.recolocandoFoco = false;
  }

  private pontoDentroDoPainel(event: MouseEvent): boolean {
    const painel = this.painel?.nativeElement;
    if (!painel) return false;
    const rect = painel.getBoundingClientRect();
    return event.clientX >= rect.left - 2 && event.clientX <= rect.right + 2
      && event.clientY >= rect.top - 2 && event.clientY <= rect.bottom + 2;
  }

  /**
   * A barra não é um filho do DOM: o alvo do clique é a própria lista.
   * preventDefault nesse clique impede o arraste, então a lista só ignora o blur.
   */
  private cliqueMantemLista(event: MouseEvent): boolean {
    const lista = this.painel?.nativeElement.querySelector('.combo-lista') as HTMLElement | null;
    if (!lista) return false;
    const podeRolar = lista.scrollHeight > lista.clientHeight + 1 || lista.scrollWidth > lista.clientWidth + 1;
    if (!podeRolar) return false;
    if (event.target === lista) return true;
    return this.ehCliqueNaBarraDeRolagem(lista, event);
  }

  private ehCliqueNaBarraDeRolagem(lista: HTMLElement, event: MouseEvent): boolean {
    const rect = lista.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left - 1 || x > rect.right + 1 || y < rect.top - 1 || y > rect.bottom + 1) {
      return false;
    }
    const barraVertical = lista.offsetWidth - lista.clientWidth;
    const barraHorizontal = lista.offsetHeight - lista.clientHeight;
    if (barraVertical > 1) {
      const rtl = getComputedStyle(lista).direction === 'rtl';
      const naVertical = rtl ? x <= rect.left + barraVertical + 1 : x >= rect.right - barraVertical - 1;
      if (naVertical) return true;
    }
    return barraHorizontal > 1 && y >= rect.bottom - barraHorizontal - 1;
  }

  private aplicarFiltroOpcoes(): void {
    const q = this.search.trim();
    const qLower = q.toLowerCase();
    if (this.minSearchLength > 0 && q.length < this.minSearchLength) {
      this.filtered = [];
    } else if (this.remoteSearch) {
      this.filtered = [...this.options];
    } else if (!this.filtrarPorTexto) {
      this.filtered = [...this.options];
    } else {
      this.filtered = !q
        ? [...this.options]
        : this.options.filter(o => o.label.toLowerCase().includes(qLower));
    }
    this.page = 1;
  }

  private syncSearchFromValue(): void {
    if (this.value == null || this.value === '') {
      this.search = '';
      return;
    }
    const found = this.options.find(o => o.value == this.value);
    this.search = found?.label ?? String(this.value ?? '');
  }

  /** A lista chega depois do valor. Com o campo fechado, o texto passa a ser o nome. */
  private atualizarRotuloDaSelecao(): void {
    if (this.open || this.value == null || this.value === '') return;
    const found = this.options.find(o => o.value == this.value);
    if (found) this.search = found.label;
    else if (typeof this.value === 'string') this.search = this.value;
  }

  private commitSearchToValue(): void {
    const q = this.search.trim();
    if (!q) {
      if (this.value != null && this.value !== '') {
        this.value = null;
        this.search = '';
        this.valueChange.emit(null);
      }
      return;
    }
    const lower = q.toLowerCase();
    let found = this.options.find(o =>
      o.label.toLowerCase() === lower || String(o.value).toLowerCase() === lower);
    if (!found) {
      const partial = this.options.filter(o => o.label.toLowerCase().includes(lower));
      if (partial.length === 1) found = partial[0];
    }
    if (!found) {
      if (this.aceitarTextoLivre) {
        if (this.value !== q) {
          this.value = q;
          this.valueChange.emit(q);
        }
        return;
      }
      if (!this.remoteSearch) this.syncSearchFromValue();
      return;
    }
    if (found.value != this.value) {
      this.value = found.value;
      this.search = found.label;
      this.valueChange.emit(found.value);
      return;
    }
    this.search = found.label;
  }
}
