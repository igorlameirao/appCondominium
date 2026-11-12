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
          *ngIf="value != null && value !== '' && !disabled"
          (mousedown)="$event.preventDefault()"
          (click)="clear()"
          tabindex="-1"
          aria-label="Limpar">×</button>
        <span class="combo-seta" aria-hidden="true">▼</span>
      </div>
      @if (open && !disabled) {
        <div class="combo-panel" #painel [ngStyle]="painelEstilo">
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

  private readonly aoReposicionar = () => {
    if (this.open) this.posicionarPainel();
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
    if (changes['options']) this.aplicarFiltroOpcoes();
  }

  ngOnDestroy(): void {
    this.desligarReposicaoViewport();
  }

  @HostListener('document:mousedown', ['$event'])
  aoClicarFora(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('keydown.escape')
  aoEsc(): void {
    if (this.open) this.fechar();
  }

  abrir(): void {
    if (this.disabled) return;
    this.open = true;
    this.ligarReposicaoViewport();
    this.cd.detectChanges();
    this.posicionarPainel();
    setTimeout(() => this.posicionarPainel());
  }

  fechar(): void {
    this.open = false;
    this.abreAcima = false;
    this.painelEstilo = {};
    this.desligarReposicaoViewport();
  }

  onSearch(): void {
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
    setTimeout(() => {
      this.fechar();
      this.commitSearchToValue();
      this.blurCommit.emit(this.value ?? null);
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
    window.addEventListener('resize', this.aoReposicionar);
    window.addEventListener('scroll', this.aoReposicionar, true);
  }

  private desligarReposicaoViewport(): void {
    window.removeEventListener('resize', this.aoReposicionar);
    window.removeEventListener('scroll', this.aoReposicionar, true);
  }

  private aplicarFiltroOpcoes(): void {
    const q = this.search.trim();
    const qLower = q.toLowerCase();
    if (this.minSearchLength > 0 && q.length < this.minSearchLength) {
      this.filtered = [];
    } else if (this.remoteSearch) {
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
