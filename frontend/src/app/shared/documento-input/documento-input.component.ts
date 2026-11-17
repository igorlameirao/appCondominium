import { Component, ElementRef, EventEmitter, forwardRef, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator
} from '@angular/forms';
import {
  mascaraCnpj, mascaraCpf, somenteDigitos, validarCnpj, validarCpf, validarCpfCnpj
} from '../../core/utils/documento-validator';

@Component({
  selector: 'app-documento-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DocumentoInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DocumentoInputComponent), multi: true }
  ],
  template: `
    <input
      type="text"
      class="doc-input"
      [class.doc-input--invalid]="invalid"
      [required]="required"
      [class.ng-invalid]="marcarNgInvalid"
      [class.ng-valid]="marcarNgValid"
      [value]="display"
      (focus)="onFocus()"
      (blur)="onBlur()"
      (input)="onInput($event)"
      [disabled]="disabled"
      [attr.maxlength]="maxLen" />
    <span class="doc-erro" *ngIf="exibirErro && invalid && touched">Documento inválido</span>
  `,
  host: { class: 'doc-input-host' },
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .doc-input { width: 100%; padding: 5px 10px; min-height: 2.125rem; font-size: 12px; border-radius: 6px; box-sizing: border-box; }
    .doc-input--invalid { border-color: #dc3545; box-shadow: 0 0 0 2px rgba(220,53,69,.15); }
    .doc-erro { color: #dc3545; font-size: 12px; }
  `]
})
export class DocumentoInputComponent implements ControlValueAccessor, Validator, OnChanges {
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  @Input() tipo: 'cpf' | 'cnpj' | 'cpfcnpj' = 'cpfcnpj';
  @Input() required = false;
  /** false: o host exibe a mensagem (ex.: `.field-error` fora do fluxo do grid). */
  @Input() exibirErro = true;
  @Output() validChange = new EventEmitter<boolean>();
  /** Emitido ao perder o foco, após validar e propagar o valor. */
  @Output() blurCommit = new EventEmitter<string>();

  display = '';
  raw = '';
  invalid = false;
  touched = false;
  disabled = false;
  maxLen = 18;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  /** Repassa classes do controle ao input nativo (styles-sco: obrigatório vazio / válido). */
  get marcarNgValid(): boolean {
    return this.required && this.documentoOk;
  }

  get marcarNgInvalid(): boolean {
    if (!this.required) return false;
    return !this.documentoOk && this.foiInteragido;
  }

  private get foiInteragido(): boolean {
    const cls = this.hostEl.nativeElement.classList;
    return this.touched || cls.contains('ng-touched') || cls.contains('ng-dirty');
  }

  private get documentoOk(): boolean {
    const v = (this.raw ?? '').trim();
    if (!v) return false;
    return this.documentoValido(v);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['required']) this.onValidatorChange();
  }

  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }

  validate(): ValidationErrors | null {
    const v = (this.raw ?? '').trim();
    if (this.required && !v) return { required: true };
    if (!v) return null;
    if (!this.documentoValido(v)) return { documentoInvalido: true };
    return null;
  }

  writeValue(v: string | null): void {
    this.raw = v ?? '';
    this.display = this.mask(this.raw);
    this.atualizarFeedback();
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
    this.atualizarFeedback();
    this.onChange(this.raw);
    this.blurCommit.emit(this.raw);
  }

  onInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.display = v;
    this.raw = this.unmask(v);
    this.atualizarFeedback();
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

  private atualizarFeedback(): void {
    const v = (this.raw ?? '').trim();
    let ok = true;
    if (v) ok = this.documentoValido(v);
    else if (this.required) ok = false;
    this.invalid = this.foiInteragido && !ok;
    this.validChange.emit(ok);
    this.onValidatorChange();
  }

  private documentoValido(v: string): boolean {
    if (this.tipo === 'cpf') return validarCpf(v);
    if (this.tipo === 'cnpj') return validarCnpj(v);
    return validarCpfCnpj(v);
  }
}
