import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  mascaraCnpj, mascaraCpf, somenteDigitos, validarCnpj, validarCpf, validarCpfCnpj
} from '../../core/utils/documento-validator';

@Component({
  selector: 'app-documento-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DocumentoInputComponent),
    multi: true
  }],
  template: `
    <input
      type="text"
      class="doc-input"
      [class.doc-input--invalid]="invalid"
      [value]="display"
      (focus)="onFocus()"
      (blur)="onBlur()"
      (input)="onInput($event)"
      [disabled]="disabled"
      [attr.maxlength]="maxLen" />
    <span class="doc-erro" *ngIf="invalid && touched">Documento inválido</span>
  `,
  styles: [`
    .doc-input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .doc-input--invalid { border-color: #dc3545; box-shadow: 0 0 0 2px rgba(220,53,69,.15); }
    .doc-erro { color: #dc3545; font-size: 12px; }
  `]
})
export class DocumentoInputComponent implements ControlValueAccessor {
  @Input() tipo: 'cpf' | 'cnpj' | 'cpfcnpj' = 'cpfcnpj';
  @Output() validChange = new EventEmitter<boolean>();

  display = '';
  raw = '';
  invalid = false;
  touched = false;
  disabled = false;
  maxLen = 18;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.raw = v ?? '';
    this.display = this.mask(this.raw);
    this.validate();
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onFocus(): void {
    this.display = this.raw;
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
    this.raw = this.unmask(this.display);
    this.display = this.mask(this.raw);
    this.validate();
    this.onChange(this.raw);
  }

  onInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.display = v;
    this.raw = this.unmask(v);
    this.validate();
    this.onChange(this.raw);
  }

  private mask(v: string): string {
    if (this.tipo === 'cpf') return mascaraCpf(v);
    if (this.tipo === 'cnpj') return mascaraCnpj(v);
    const d = somenteDigitos(v);
    return d.length <= 11 ? mascaraCpf(v) : mascaraCnpj(v);
  }

  private unmask(v: string): string {
    if (this.tipo === 'cnpj') return v.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 14);
    return somenteDigitos(v);
  }

  private validate(): void {
    let ok = true;
    if (this.raw) {
      if (this.tipo === 'cpf') ok = validarCpf(this.raw);
      else if (this.tipo === 'cnpj') ok = validarCnpj(this.raw);
      else ok = validarCpfCnpj(this.raw);
    }
    this.invalid = !ok;
    this.validChange.emit(ok);
  }
}
