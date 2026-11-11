import { Component, Input, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
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
    '[class.campo-data--disabled]': 'disabled'
  },
  template: `
    <div class="campo-data-hora__row">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="campo-data__field">
        <input matInput
          [matDatepicker]="picker"
          [value]="dateValue"
          (dateChange)="onDate($event)"
          (dateInput)="onDate($event)"
          (blur)="onTouched()"
          [disabled]="disabled"
          [required]="required"
          autocomplete="off" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" [disabled]="disabled"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
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
    .campo-data__field { width: 100%; }
  `]
})
export class CampoDataHoraComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() required = false;

  dateValue: Date | null = null;
  timeValue = '';
  disabled = false;
  private separator: 'T' | ' ' = 'T';

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: string | null): void {
    const parsed = parseDateTime(value);
    this.dateValue = parsed.date;
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

  onDate(event: MatDatepickerInputEvent<Date>): void {
    this.dateValue = event.value ?? null;
    this.emit();
  }

  onTime(event: Event): void {
    this.timeValue = (event.target as HTMLInputElement).value;
    this.emit();
  }

  validate(): ValidationErrors | null {
    return this.required && !this.dateValue ? { required: true } : null;
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
