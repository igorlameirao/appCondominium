import { Component, Input, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Icone } from '../icone';

/** Data (DATE) com seletor do Angular Material. Valor: `YYYY-MM-DD`. */
@Component({
  selector: 'app-campo-data',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, Icone],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoDataComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CampoDataComponent), multi: true }
  ],
  host: {
    class: 'campo-data campo-data--digitar-manual',
    '[class.campo-data--required]': 'required',
    '[class.campo-data--disabled]': 'disabled',
    '[class.campo-data--validacao-visual]': 'validacaoVisualDetalhada',
    '[class.campo-data--texto-invalido]': 'exibirTextoInvalido && !validacaoVisualDetalhada',
    '[class.campo-data--data-invalida-ui]': 'exibirTextoInvalido && validacaoVisualDetalhada'
  },
  template: `
    <div class="campo-data-sge-wrap">
      <div class="campo-data-sge-shell">
        <input type="text"
          class="campo-data-sge-input campo-data__texto"
          [(ngModel)]="textoDigitado"
          [ngModelOptions]="{standalone: true}"
          (input)="onTextoInput($event)"
          (focus)="onTextoFocus()"
          (blur)="confirmarTextoDigitado()"
          [disabled]="disabled"
          autocomplete="off"
          inputmode="numeric"
          placeholder="dd/mm/aaaa"
          maxlength="10" />
        @if (validacaoVisualDetalhada && exibirTextoInvalido) {
          <app-icone class="campo-data-sge-alerta" nome="alert" [tamanho]="16" />
        }
        <mat-datepicker-toggle class="campo-data-sge-toggle" [for]="picker" [disabled]="disabled"></mat-datepicker-toggle>
      </div>
      @if (validacaoVisualDetalhada && exibirTextoInvalido) {
        <p class="campo-data-sge-erro" role="alert">Data inválida</p>
      }
      <input matInput class="campo-data__picker-anchor"
        [matDatepicker]="picker"
        [value]="dateValue"
        tabindex="-1"
        aria-hidden="true"
        (dateChange)="onDate($event)" />
      <mat-datepicker #picker></mat-datepicker>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    :host.campo-data--validacao-visual .campo-data-sge-shell {
      padding: 0 6px 0 12px;
      gap: 4px;
      overflow: visible;
    }
    :host.campo-data--validacao-visual .campo-data-sge-shell {
      grid-template-columns: minmax(0, 1fr) auto auto;
    }
    :host.campo-data--validacao-visual.campo-data--required.ng-valid .campo-data-sge-shell {
      border-color: #000;
      border-width: 1px;
    }
    :host.campo-data--validacao-visual.campo-data--required.ng-invalid:not(.campo-data--data-invalida-ui) .campo-data-sge-shell {
      border-color: #dc3545;
      border-width: 1px;
    }
    :host.campo-data--validacao-visual.campo-data--data-invalida-ui .campo-data-sge-shell {
      border-color: #dc3545;
      border-width: 2px;
    }
    :host.campo-data--validacao-visual .campo-data-sge-alerta {
      color: #dc3545;
      flex-shrink: 0;
    }
    :host.campo-data--validacao-visual .campo-data-sge-erro {
      margin: 2px 0 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.25;
      color: #dc3545;
    }
  `]
})
export class CampoDataComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() required = false;
  /** Insere barras dd/mm/aaaa enquanto digita (confirma valor no blur/calendário). */
  @Input() mascaraAoDigitar = true;
  /** Ícone + mensagem para data inválida (padrão SGE em todo o sistema). */
  @Input() validacaoVisualDetalhada = true;

  dateValue: Date | null = null;
  textoDigitado = '';
  disabled = false;
  aposBlur = false;
  private editandoTexto = false;

  get exibirTextoInvalido(): boolean {
    const t = this.textoDigitado.trim();
    if (!t || this.dateValue) return false;
    if (this.editandoTexto) return false;
    return this.aposBlur || t.length >= 10;
  }

  onTextoFocus(): void {
    this.editandoTexto = true;
    this.aposBlur = false;
  }

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: string | null): void {
    this.dateValue = parseYmd(value);
    this.textoDigitado = formatBr(this.dateValue);
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['required']) this.onValidatorChange();
  }

  onTextoInput(event: Event): void {
    if (!this.mascaraAoDigitar) return;
    const input = event.target as HTMLInputElement;
    const masked = maskBrDigits(input.value);
    if (input.value !== masked) {
      input.value = masked;
    }
    this.textoDigitado = masked;
    this.sincronizarValorComTexto(masked);
  }

  private sincronizarValorComTexto(texto: string): void {
    const t = texto.trim();
    if (t.length < 10) {
      if (this.dateValue) {
        this.dateValue = null;
        this.onChange('');
        this.onValidatorChange();
      }
      return;
    }
    const parsed = parseBr(t);
    if (parsed) {
      this.dateValue = parsed;
      this.onChange(formatYmd(parsed));
    } else {
      this.dateValue = null;
      this.onChange('');
    }
    this.onValidatorChange();
  }

  confirmarTextoDigitado(): void {
    this.editandoTexto = false;
    this.aposBlur = true;
    const bruto = this.textoDigitado.trim();
    if (!bruto) {
      this.dateValue = null;
      this.textoDigitado = '';
      this.onChange('');
      this.onTouched();
      this.onValidatorChange();
      return;
    }
    const parsed = parseBr(bruto);
    if (!parsed) {
      this.dateValue = null;
      this.onChange('');
    } else {
      this.dateValue = parsed;
      this.textoDigitado = formatBr(parsed);
      this.onChange(formatYmd(parsed));
    }
    this.onTouched();
    this.onValidatorChange();
  }

  onDate(event: MatDatepickerInputEvent<Date>): void {
    this.dateValue = event.value ?? null;
    this.textoDigitado = formatBr(this.dateValue);
    this.onChange(formatYmd(this.dateValue));
    this.onTouched();
    this.onValidatorChange();
  }

  validate(): ValidationErrors | null {
    const t = this.textoDigitado.trim();
    if (!t) {
      return this.required ? { required: true } : null;
    }
    if (!this.dateValue) {
      if (this.aposBlur || t.length >= 10) return { dataInvalida: true };
      return null;
    }
    return null;
  }
}

export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (!match) return null;
  return new Date(+match[1], +match[2] - 1, +match[3]);
}

export function formatYmd(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatBr(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Máscara parcial: só dígitos → `dd/mm/aaaa` (até 8 dígitos). */
export function maskBrDigits(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseBr(text: string): Date | null {
  const raw = text.trim();
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slash) {
    return validBrDate(+slash[1], +slash[2], +slash[3]);
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    return validBrDate(+digits.slice(0, 2), +digits.slice(2, 4), +digits.slice(4, 8));
  }
  return null;
}

function validBrDate(day: number, month: number, year: number): Date | null {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}
