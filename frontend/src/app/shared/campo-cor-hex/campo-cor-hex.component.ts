import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icone } from '../icone';
import { corHexComPadrao, corHexValida, parseCorHex } from '../cor-hex/cor-hex.util';

@Component({
  selector: 'app-campo-cor-hex',
  standalone: true,
  imports: [CommonModule, Icone],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoCorHexComponent),
      multi: true,
    },
  ],
  template: `
    <div class="cad-campo-cor" [class.cad-campo-cor--invalido]="hexInvalido" [class.cad-campo-cor--desabilitado]="disabled">
      <label class="cad-campo-cor__rotulo" [attr.for]="inputHexId">
        <span>{{ label }}</span>
        <app-icone *ngIf="infoRt" nome="info" [tamanho]="14" class="cad-campo-cor__info" title="RT-Gerais 13 — cor institucional na interface e login" />
      </label>
      <div class="cad-campo-cor__controle">
        <label class="cad-campo-cor__amostra" [attr.aria-label]="'Selecionar cor visualmente'">
          <span class="cad-campo-cor__swatch" [style.background]="corPreview"></span>
          <input
            type="color"
            class="cad-campo-cor__nativo"
            [value]="corPreview"
            [disabled]="disabled"
            (input)="aoSelecionarNativo($event)"
            (change)="aoSelecionarNativo($event)" />
        </label>
        <input
          type="text"
          class="cad-campo-cor__hex"
          [id]="inputHexId"
          [value]="textoHex"
          [disabled]="disabled"
          [class.cad-campo-cor__hex--invalido]="hexInvalido"
          maxlength="7"
          spellcheck="false"
          autocomplete="off"
          aria-describedby="hexErro"
          (input)="aoDigitarHex($event)"
          (blur)="aoConfirmarHex()" />
      </div>
      <span id="hexErro" class="cad-campo-cor__erro" *ngIf="hexInvalido">Informe um código HEX válido (#RRGGBB).</span>
    </div>
  `,
})
export class CampoCorHexComponent implements ControlValueAccessor, OnChanges {
  @Input() label = 'Cor';
  @Input() infoRt = false;
  @Input() disabled = false;
  @Input() padrao = '#0e7490';

  @Output() corPreviewChange = new EventEmitter<string>();

  readonly inputHexId = `campo-cor-hex-${CampoCorHexComponent.proximoId++}`;

  textoHex = '#0E7490';
  corPreview = '#0E7490';
  hexInvalido = false;

  private valorModelo = '';
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  private static proximoId = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['padrao'] && !this.valorModelo) {
      this.aplicarValor(corHexComPadrao(this.padrao, '#0e7490'), false);
    }
  }

  writeValue(v: string | null): void {
    this.valorModelo = v ?? '';
    const norm = parseCorHex(this.valorModelo) ?? parseCorHex(this.padrao) ?? '#0E7490';
    this.textoHex = norm;
    this.corPreview = norm;
    this.hexInvalido = false;
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  aoSelecionarNativo(ev: Event): void {
    if (this.disabled) return;
    const v = (ev.target as HTMLInputElement).value;
    this.aplicarValor(v, true);
  }

  aoDigitarHex(ev: Event): void {
    if (this.disabled) return;
    this.textoHex = (ev.target as HTMLInputElement).value;
    const ok = corHexValida(this.textoHex);
    this.hexInvalido = this.textoHex.trim().length > 0 && !ok;
    if (ok) {
      const norm = parseCorHex(this.textoHex)!;
      this.corPreview = norm;
      this.corPreviewChange.emit(norm);
    }
  }

  aoConfirmarHex(): void {
    this.onTouched();
    if (!this.textoHex.trim()) {
      this.aplicarValor(this.padrao, true);
      return;
    }
    const norm = parseCorHex(this.textoHex);
    if (!norm) {
      this.hexInvalido = true;
      this.textoHex = this.corPreview;
      return;
    }
    this.aplicarValor(norm, true);
  }

  private aplicarValor(hex: string, emitirModelo: boolean): void {
    const norm = parseCorHex(hex) ?? parseCorHex(this.padrao) ?? '#0E7490';
    this.corPreview = norm;
    this.textoHex = norm;
    this.hexInvalido = false;
    this.corPreviewChange.emit(norm);
    if (emitirModelo) {
      this.valorModelo = norm;
      this.onChange(norm);
    }
  }
}
