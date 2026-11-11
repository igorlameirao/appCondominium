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

/** Data (DATE) com seletor do Angular Material. Valor: `YYYY-MM-DD`. */
@Component({
  selector: 'app-campo-data',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoDataComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CampoDataComponent), multi: true }
  ],
  host: {
    class: 'campo-data',
    '[class.campo-data--required]': 'required',
    '[class.campo-data--disabled]': 'disabled'
  },
  template: `
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
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .campo-data__field { width: 100%; }
  `]
})
export class CampoDataComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() required = false;

  dateValue: Date | null = null;
  disabled = false;

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: string | null): void {
    this.dateValue = parseYmd(value);
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
    this.onChange(formatYmd(this.dateValue));
    this.onTouched();
  }

  validate(): ValidationErrors | null {
    return this.required && !this.dateValue ? { required: true } : null;
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
