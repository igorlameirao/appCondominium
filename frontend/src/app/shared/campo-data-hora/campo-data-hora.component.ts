import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { formatYmd, parseYmd } from '../campo-data/campo-data.component';
import {
  aplicarMascaraData,
  dataParaDigitos,
  parseDataEstrita,
  posicaoAposDigitos
} from '../campo-data/campo-data-mascara.util';
import { avaliarTextoData, dataAceita, resolverDataCommit } from '../campo-data/campo-data-validacao.util';

/** Data e hora (DATETIME): calendário Material + hora. Valor: `YYYY-MM-DDTHH:mm:ss` ou com espaço. */
@Component({
  selector: 'app-campo-data-hora',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoDataHoraComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CampoDataHoraComponent), multi: true }
  ],
  host: {
    class: 'campo-data-hora',
    '[class.campo-data--required]': 'required',
    '[class.campo-data--disabled]': 'disabled',
    '[class.campo-data--feedback]': 'feedbackVisual',
    '[class.campo-data--invalida]': 'exibirInvalida'
  },
  template: `
    <div class="campo-data-hora__row">
      <div class="campo-data-hora__data">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="campo-data__field">
          <input #dataInput matInput
            [matDatepicker]="picker"
            [value]="feedbackVisual ? null : dateValue"
            (beforeinput)="onAntesDigitar($event)"
            (keydown)="onTeclaData($event)"
            (focus)="onFocoData($event)"
            (dateChange)="onDateCommit($event)"
            (dateInput)="onDateTyping($event)"
            (input)="onTextoData($event)"
            (blur)="onDateBlur($event)"
            [disabled]="disabled"
            [required]="required"
            [attr.inputmode]="feedbackVisual ? 'numeric' : null"
            [attr.aria-invalid]="exibirInvalida ? true : null"
            autocomplete="off" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" [disabled]="disabled"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        @if (exibirInvalida) {
          <span class="campo-data__alerta" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </span>
          <p class="campo-data__msg">Data inválida</p>
        }
      </div>
      <div class="campo-data-hora__hora">
        <input type="time" class="campo-data-hora__time"
          [class.campo-data-hora__time--invalida]="exibirHoraInvalida"
          [value]="timeValue"
          (input)="onTime($event)"
          (blur)="onTimeBlur($event)"
          [disabled]="disabled"
          [required]="required" />
        @if (exibirHoraInvalida) {
          <p class="campo-data__msg">Hora inválida</p>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .campo-data__field { width: 100%; }
    :host:not(.campo-data--feedback) .campo-data-hora__data { display: contents; }
    :host:not(.campo-data--feedback) .campo-data-hora__hora { display: contents; }
    :host(.campo-data--feedback) .campo-data-hora__hora {
      position: relative;
      flex: 0 0 5.25rem;
      width: 5.25rem;
      min-width: 5.25rem;
    }
    :host(.campo-data--feedback) .campo-data-hora__data {
      position: relative;
      flex: 1 1 auto;
      min-width: 0;
    }
    :host(.campo-data--feedback) .campo-data__alerta {
      position: absolute;
      top: 50%;
      right: 34px;
      z-index: 1;
      display: flex;
      width: 12px;
      height: 12px;
      color: #dc3545;
      pointer-events: none;
      transform: translateY(-50%);
    }
    :host(.campo-data--feedback) .campo-data__msg {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      margin: 0;
      padding: 0;
      font-size: 10px;
      line-height: 10px;
      color: #dc3545;
      white-space: nowrap;
      pointer-events: none;
    }
    :host(.campo-data--feedback) .campo-data-hora__hora .campo-data__msg {
      right: 0;
      left: auto;
    }
  `]
})
export class CampoDataHoraComponent implements ControlValueAccessor, Validator, OnChanges {
  @ViewChild('dataInput') dataInput?: ElementRef<HTMLInputElement>;

  @Input() required = false;
  /** Validação visual da data e da hora. Desligado nas demais telas. */
  @Input() feedbackVisual = false;
  /** Data de nascimento: rejeita data futura, além de data inexistente. */
  @Input() nascimento = false;

  dateValue: Date | null = null;
  timeValue = '';
  disabled = false;
  exibirInvalida = false;
  exibirHoraInvalida = false;
  private textoData = '';
  /** Evita que o modelo vazio reescreva o texto enquanto a data digitada ainda é inválida. */
  private ignorarWriteVazio = false;
  private separator: 'T' | ' ' = 'T';

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: string | null): void {
    if (this.ignorarWriteVazio && (value == null || value === '')) return;
    this.ignorarWriteVazio = false;
    const parsed = parseDateTime(value);
    this.dateValue = parsed.date;
    this.timeValue = parsed.time;
    this.separator = parsed.separator;
    if (this.feedbackVisual && this.dateValue) {
      this.textoData = aplicarMascaraData(dataParaDigitos(this.dateValue));
      queueMicrotask(() => this.atualizarTextoInput());
    }
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['required']) this.onValidatorChange();
  }

  onTeclaData(event: KeyboardEvent): void {
    if (!this.feedbackVisual || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1 || /\d/.test(event.key)) return;
    event.preventDefault();
  }

  onAntesDigitar(event: InputEvent): void {
    if (!this.feedbackVisual || !event.inputType.startsWith('insert') || event.data == null) return;
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const digitos = event.data.replace(/\D/g, '');
    if (!digitos) return;
    const inicio = input.selectionStart ?? input.value.length;
    const fim = input.selectionEnd ?? inicio;
    const combinado = input.value.slice(0, inicio) + digitos + input.value.slice(fim);
    const digitosAntes = input.value.slice(0, inicio).replace(/\D/g, '').length + digitos.length;
    this.escreverMascara(input, combinado, digitosAntes);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  onFocoData(event: FocusEvent): void {
    if (!this.feedbackVisual) return;
    const input = event.target as HTMLInputElement;
    const data = parseDataEstrita(input.value.trim());
    if (!data) return;
    const mascarado = aplicarMascaraData(dataParaDigitos(data));
    if (input.value !== mascarado) input.value = mascarado;
  }

  onTextoData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.feedbackVisual) {
      this.textoData = input.value.trim();
      return;
    }
    const cursor = input.selectionStart ?? input.value.length;
    const digitosAntes = input.value.slice(0, cursor).replace(/\D/g, '').length;
    this.escreverMascara(input, input.value, digitosAntes);
    this.textoData = input.value;
    this.sincronizarEstadoTexto();
  }

  onDateBlur(event: FocusEvent): void {
    this.onTouched();
    if (!this.feedbackVisual) return;
    this.textoData = ((event.target as HTMLInputElement).value ?? '').trim();
    this.sincronizarEstadoTexto();
  }

  onDateTyping(_event: MatDatepickerInputEvent<Date>): void {
    if (!this.feedbackVisual) {
      this.aplicarData(_event);
    }
  }

  onDateCommit(event: MatDatepickerInputEvent<Date>): void {
    if (!this.feedbackVisual) {
      this.aplicarData(event);
      return;
    }
    const bruto = ((event.targetElement as HTMLInputElement).value ?? '').trim();
    this.textoData = bruto;
    const res = resolverDataCommit(bruto, event.value);
    if (res === 'limpar') {
      this.limparData();
      return;
    }
    if (res === 'invalida' || !dataAceita(res, this.nascimento)) {
      this.marcarDataInvalida();
      return;
    }
    this.confirmarDataValida(res);
  }

  private aplicarData(event: MatDatepickerInputEvent<Date>): void {
    this.dateValue = event.value ?? null;
    this.emit();
  }

  onTime(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.timeValue = input.value;
    if (this.feedbackVisual && !horaInvalida(input)) this.exibirHoraInvalida = false;
    this.emit();
  }

  onTimeBlur(event: FocusEvent): void {
    this.onTouched();
    if (!this.feedbackVisual) return;
    const input = event.target as HTMLInputElement;
    this.timeValue = input.value;
    this.exibirHoraInvalida = horaInvalida(input);
  }

  validate(): ValidationErrors | null {
    return this.required && !this.dateValue ? { required: true } : null;
  }

  private escreverMascara(input: HTMLInputElement, bruto: string, digitosAntes: number): void {
    const mascarado = aplicarMascaraData(bruto);
    if (input.value === mascarado) return;
    input.value = mascarado;
    const pos = posicaoAposDigitos(mascarado, digitosAntes);
    input.setSelectionRange(pos, pos);
  }

  private sincronizarEstadoTexto(): void {
    const av = avaliarTextoData(this.textoData, this.nascimento);
    if (av.incompleta) {
      this.exibirInvalida = false;
      if (!this.textoData.trim()) this.limparData();
      return;
    }
    this.exibirInvalida = !av.valida;
    if (av.valida && av.data) {
      this.confirmarDataValida(av.data);
    } else if (!av.valida) {
      this.marcarDataInvalida(false);
    }
  }

  private confirmarDataValida(data: Date): void {
    this.exibirInvalida = false;
    this.ignorarWriteVazio = false;
    this.dateValue = data;
    const mascarado = aplicarMascaraData(dataParaDigitos(data));
    this.textoData = mascarado;
    this.atualizarTextoInput(mascarado);
    this.emit();
    this.onValidatorChange();
  }

  private atualizarTextoInput(texto?: string): void {
    if (!this.feedbackVisual) return;
    const el = this.dataInput?.nativeElement;
    if (!el) return;
    const valor = texto ?? this.textoData;
    if (el.value !== valor) el.value = valor;
  }

  private limparData(): void {
    this.exibirInvalida = false;
    this.ignorarWriteVazio = false;
    this.dateValue = null;
    this.emit();
    this.onValidatorChange();
  }

  private marcarDataInvalida(emitirVazio = true): void {
    this.exibirInvalida = true;
    this.ignorarWriteVazio = true;
    this.dateValue = null;
    if (emitirVazio) {
      this.onChange('');
      this.onTouched();
      this.onValidatorChange();
    }
  }

  private emit(): void {
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

function horaInvalida(input: HTMLInputElement): boolean {
  if (!input.value) return input.validity.badInput;
  return !input.validity.valid || !/^\d{2}:\d{2}/.test(input.value);
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
