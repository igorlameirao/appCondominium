import {
  Component,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icone } from '../icone';
import { parseCorHex } from '../cor-hex/cor-hex.util';
import {
  FormatoCor,
  HUG_PALETA_CORES,
  hexParaTexto,
  nomeCorPorHex,
  textoParaHex,
} from '../cor-hex/cor-format.util';

@Component({
  selector: 'app-hug-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, Icone],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HugColorPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="hug-color-picker" [class.hug-color-picker--aberto]="painelAberto" [class.hug-color-picker--invalido]="invalido" [class.hug-color-picker--desabilitado]="disabled">
      <label class="hug-color-picker__rotulo" [attr.for]="disparoId">{{ label }}</label>
      <button
        type="button"
        class="hug-color-picker__disparo"
        [id]="disparoId"
        [disabled]="disabled"
        [attr.aria-expanded]="painelAberto"
        aria-haspopup="dialog"
        (click)="alternarPainel($event)">
        <span class="hug-color-picker__amostra" [style.background]="corPreview" aria-hidden="true"></span>
        <span class="hug-color-picker__valor">{{ nomeExibicao }}</span>
        <app-icone nome="chevron-down" [tamanho]="14" class="hug-color-picker__chevron" />
      </button>

      @if (painelAberto) {
        <div class="hug-color-picker__painel" role="dialog" aria-label="Seletor de cor">
          <div class="hug-color-picker__busca">
            <app-icone nome="search" [tamanho]="14" />
            <input
              type="search"
              class="hug-color-picker__busca-input"
              placeholder="Buscar cor pelo nome…"
              [(ngModel)]="filtroPaleta"
              [ngModelOptions]="{ standalone: true }"
              (keydown.escape)="fecharPainel()" />
          </div>
          <div class="hug-color-picker__paleta" role="listbox" aria-label="Cores predefinidas">
            @for (item of paletaFiltrada; track item.hex) {
              <button
                type="button"
                class="hug-color-picker__paleta-item"
                role="option"
                [class.hug-color-picker__paleta-item--ativa]="item.hex === corPreview"
                [attr.aria-selected]="item.hex === corPreview"
                (click)="selecionarPaleta(item.hex)">
                <span class="hug-color-picker__paleta-swatch" [style.background]="item.hex"></span>
                <span class="hug-color-picker__paleta-nome">{{ item.nome }}</span>
              </button>
            }
          </div>
          <label class="hug-color-picker__nativo-label">
            <span>Seletor visual</span>
            <input type="color" class="hug-color-picker__nativo" [value]="corPreview" [disabled]="disabled" (input)="aoNativo($event)" />
          </label>
          <button type="button" class="hug-color-picker__avancado-toggle" (click)="edicaoAvancada = !edicaoAvancada">
            {{ edicaoAvancada ? 'Ocultar edição avançada' : 'Edição avançada (HEX, RGB, CMYK)' }}
          </button>
          @if (edicaoAvancada) {
            <div class="hug-color-picker__formatos" role="tablist" aria-label="Formato de cor">
              @for (f of formatos; track f) {
                <button type="button" role="tab" class="hug-color-picker__formato" [class.hug-color-picker__formato--ativa]="formato === f" [attr.aria-selected]="formato === f" (click)="mudarFormato(f)">
                  {{ f | uppercase }}
                </button>
              }
            </div>
            <input
              type="text"
              class="hug-color-picker__entrada"
              [class.hug-color-picker__entrada--invalido]="invalido"
              [value]="textoFormato"
              [disabled]="disabled"
              spellcheck="false"
              autocomplete="off"
              [attr.aria-invalid]="invalido"
              (input)="aoDigitar($event)"
              (blur)="confirmarEntrada()" />
            @if (formato === 'cmyk') {
              <p class="hug-color-picker__aviso-cmyk">Conversão CMYK → RGB é aproximada (prévia em tela).</p>
            }
            @if (invalido) {
              <span class="hug-color-picker__erro" role="alert">Valor de cor inválido para o formato {{ formato | uppercase }}.</span>
            }
          }
        </div>
      }
    </div>
  `,
})
export class HugColorPickerComponent implements ControlValueAccessor, OnChanges {
  @Input() label = 'Cor Padrão';
  @Input() disabled = false;
  @Input() padrao = '#0e7490';

  readonly disparoId = `hug-color-picker-${HugColorPickerComponent.proximoId++}`;
  readonly formatos: FormatoCor[] = ['hex', 'rgb', 'cmyk'];

  corPreview = '#0E7490';
  textoFormato = '#0E7490';
  formato: FormatoCor = 'hex';
  filtroPaleta = '';
  painelAberto = false;
  edicaoAvancada = false;
  invalido = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  private static proximoId = 0;

  get nomeExibicao(): string {
    return nomeCorPorHex(this.corPreview);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['padrao'] && !this.corPreview) {
      this.definirCor(this.padrao, true);
    }
  }

  get paletaFiltrada() {
    const f = this.filtroPaleta.trim().toLowerCase();
    if (!f) return HUG_PALETA_CORES;
    return HUG_PALETA_CORES.filter(c => c.nome.toLowerCase().includes(f));
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(ev: MouseEvent): void {
    if (!this.painelAberto) return;
    const el = ev.target as HTMLElement;
    if (!el.closest('.hug-color-picker')) this.fecharPainel();
  }

  writeValue(v: string | null): void {
    const hex = parseCorHex(v) ?? parseCorHex(this.padrao) ?? '#0E7490';
    this.definirCor(hex, false);
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.painelAberto = false;
  }

  alternarPainel(ev: Event): void {
    ev.stopPropagation();
    if (this.disabled) return;
    this.painelAberto = !this.painelAberto;
    if (this.painelAberto) {
      this.filtroPaleta = '';
      this.edicaoAvancada = false;
    }
  }

  fecharPainel(): void {
    this.painelAberto = false;
    this.edicaoAvancada = false;
    this.onTouched();
  }

  selecionarPaleta(hex: string): void {
    this.definirCor(hex, true);
    this.invalido = false;
  }

  aoNativo(ev: Event): void {
    if (this.disabled) return;
    const v = (ev.target as HTMLInputElement).value;
    this.definirCor(v, true);
  }

  mudarFormato(f: FormatoCor): void {
    if (this.formato === f) return;
    this.formato = f;
    this.invalido = false;
    this.textoFormato = hexParaTexto(this.corPreview, f);
  }

  aoDigitar(ev: Event): void {
    if (this.disabled) return;
    this.textoFormato = (ev.target as HTMLInputElement).value;
    const hex = textoParaHex(this.textoFormato, this.formato);
    this.invalido = this.textoFormato.trim().length > 0 && !hex;
    if (hex) this.corPreview = hex;
  }

  confirmarEntrada(): void {
    this.onTouched();
    if (!this.textoFormato.trim()) {
      this.definirCor(this.padrao, true);
      return;
    }
    const hex = textoParaHex(this.textoFormato, this.formato);
    if (!hex) {
      this.invalido = true;
      this.textoFormato = hexParaTexto(this.corPreview, this.formato);
      return;
    }
    this.definirCor(hex, true);
  }

  private definirCor(hex: string, emitir: boolean): void {
    const norm = parseCorHex(hex) ?? parseCorHex(this.padrao) ?? '#0E7490';
    this.corPreview = norm;
    this.invalido = false;
    this.sincronizarTextoDoHex(false);
    if (emitir) this.onChange(norm);
  }

  private sincronizarTextoDoHex(atualizarPreview: boolean): void {
    if (atualizarPreview) this.corPreview = parseCorHex(this.corPreview) ?? this.corPreview;
    this.textoFormato = hexParaTexto(this.corPreview, this.formato);
  }
}
