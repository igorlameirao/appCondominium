import {
  Component,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  formatarMoedaExibir,
  moedaNumeroParaTextoApi,
  parseNumeroMoeda,
} from './moeda-format.util';

export type CampoMoedaModo = 'numero' | 'texto';

@Component({
  selector: 'app-campo-moeda',
  standalone: true,
  host: { style: 'display:block;width:100%;max-width:100%' },
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoMoedaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CampoMoedaComponent),
      multi: true,
    },
  ],
  template: `
    <input
      type="text"
      inputmode="decimal"
      autocomplete="off"
      class="caixa-conferencia__input-moeda"
      [disabled]="disabled"
      [readonly]="readonly"
      [required]="required"
      [value]="texto"
      (input)="onInput($event)"
      (blur)="onBlur()"
      (focus)="onFocus()" />
  `,
})
export class CampoMoedaComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() modo: CampoMoedaModo = 'numero';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;

  texto = '';
  private valorInterno: number | string | null | undefined;
  private editando = false;
  private onChange: (v: number | string | null | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modo'] && !this.editando) {
      this.atualizarTexto();
    }
  }

  writeValue(valor: number | string | null | undefined): void {
    this.valorInterno = valor;
    if (!this.editando) this.atualizarTexto();
  }

  registerOnChange(fn: (v: number | string | null | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required) return null;
    const v = control.value;
    if (v === null || v === undefined || v === '') return { required: true };
    return null;
  }

  onFocus(): void {
    this.editando = true;
    const n = this.valorComoNumero();
    if (n !== null) {
      this.texto = n.toFixed(2).replace('.', ',');
    }
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.texto = input.value;
    this.emitirParcial(input.value);
  }

  onBlur(): void {
    this.editando = false;
    this.onTouched();
    const n = parseNumeroMoeda(this.texto);
    if (this.texto.trim() === '') {
      this.valorInterno = this.modo === 'numero' ? undefined : '';
      this.onChange(this.valorInterno);
      this.texto = '';
      return;
    }
    if (n === null) {
      this.atualizarTexto();
      return;
    }
    if (this.modo === 'numero') {
      this.valorInterno = n;
      this.onChange(n);
    } else {
      const textoApi = moedaNumeroParaTextoApi(n);
      this.valorInterno = textoApi;
      this.onChange(textoApi);
    }
    this.texto = formatarMoedaExibir(n);
  }

  private emitirParcial(texto: string): void {
    const n = parseNumeroMoeda(texto);
    if (texto.trim() === '') {
      this.onChange(this.modo === 'numero' ? undefined : '');
      return;
    }
    if (n === null) return;
    this.onChange(this.modo === 'numero' ? n : moedaNumeroParaTextoApi(n));
  }

  private valorComoNumero(): number | null {
    if (this.valorInterno === null || this.valorInterno === undefined || this.valorInterno === '') {
      return null;
    }
    if (typeof this.valorInterno === 'number') return this.valorInterno;
    return parseNumeroMoeda(String(this.valorInterno));
  }

  private atualizarTexto(): void {
    this.texto = formatarMoedaExibir(this.valorInterno);
  }
}
