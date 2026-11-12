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
import { MatInputModule } from '@angular/material/input';
import { Icone } from '../icone';
import {
  formatBr,
  formatYmd,
  maskBrDigits,
  parseBr,
  parseYmd
} from '../campo-data/campo-data.component';

/** Data e hora (DATETIME): calendário Material + hora. Valor: `YYYY-MM-DDTHH:mm:ss` ou com espaço. */
@Component({
  selector: 'app-campo-data-hora',
  standalone: true,
  imports: [FormsModule, MatInputModule, MatDatepickerModule, Icone],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoDataHoraComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CampoDataHoraComponent), multi: true }
  ],
  host: {
    class: 'campo-data-hora campo-data--digitar-manual',
    '[class.campo-data--required]': 'required',
    '[class.campo-data--disabled]': 'disabled',
    '[class.campo-data--validacao-visual]': 'validacaoVisualDetalhada',
    '[class.campo-data--texto-invalido]': 'exibirTextoInvalido && !validacaoVisualDetalhada',
    '[class.campo-data--data-invalida-ui]': 'exibirTextoInvalido && validacaoVisualDetalhada'
  },
  template: `
    <div class="campo-data-hora__row">
      <div class="campo-data-sge-wrap campo-data-hora__data">
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
      <input type="time" class="campo-data-hora__time"
        [value]="timeValue"
        (input)="onTime($event)"
        (blur)="onTouched()"
        [disabled]="disabled"
        [required]="required" />
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
export class CampoDataHoraComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() required = false;
  @Input() mascaraAoDigitar = true;
  @Input() validacaoVisualDetalhada = true;

  dateValue: Date | null = null;
  textoDigitado = '';
  timeValue = '';
  disabled = false;
  aposBlur = false;
  private editandoTexto = false;
  private separator: 'T' | ' ' = 'T';

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
    const parsed = parseDateTime(value);
    this.dateValue = parsed.date;
    this.textoDigitado = formatBr(parsed.date);
    this.timeValue = parsed.time;
    this.separator = parsed.separator;
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
        this.emit('');
        this.onValidatorChange();
      }
      return;
    }
    const parsed = parseBr(t);
    if (parsed) {
      this.dateValue = parsed;
      this.emit();
    } else {
      this.dateValue = null;
      this.emit('');
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
      this.emit('');
      this.onTouched();
      this.onValidatorChange();
      return;
    }
    const parsed = parseBr(bruto);
    if (!parsed) {
      this.dateValue = null;
      this.emit('');
    } else {
      this.dateValue = parsed;
      this.textoDigitado = formatBr(parsed);
      this.emit();
    }
    this.onTouched();
    this.onValidatorChange();
  }

  onDate(event: MatDatepickerInputEvent<Date>): void {
    this.dateValue = event.value ?? null;
    this.textoDigitado = formatBr(this.dateValue);
    this.emit();
    this.onValidatorChange();
  }

  onTime(event: Event): void {
    this.timeValue = (event.target as HTMLInputElement).value;
    this.emit();
  }

  validate(): ValidationErrors | null {
    const t = this.textoDigitado.trim();
    if (!t && !this.dateValue) {
      return this.required ? { required: true } : null;
    }
    if (t && !this.dateValue) {
      if (this.aposBlur || t.length >= 10) return { dataInvalida: true };
      return null;
    }
    if (this.required && !this.dateValue) return { required: true };
    return null;
  }

  private emit(partial?: string): void {
    if (partial !== undefined) {
      this.onChange(partial);
      return;
    }
    if (!this.dateValue || Number.isNaN(this.dateValue.getTime())) {
      this.onChange('');
      this.onTouched();
      return;
    }
    const time = this.timeValue && this.timeValue.length >= 4 ? this.timeValue.slice(0, 5) : '00:00';
    this.onChange(`${formatYmd(this.dateValue)}${this.separator}${time}:00`);
    this.onTouched();
  }
}

function parseDateTime(value: string | null | undefined): { date: Date | null; time: string; separator: 'T' | ' ' } {
  if (!value) return { date: null, time: '', separator: 'T' };
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:([T\s])(\d{2}):(\d{2}))?/.exec(String(value).trim());
  if (!match) return { date: null, time: '', separator: 'T' };
  return {
    date: parseYmd(`${match[1]}-${match[2]}-${match[3]}`),
    time: match[5] ? `${match[5]}:${match[6]}` : '',
    separator: match[4] === ' ' ? ' ' : 'T'
  };
}
