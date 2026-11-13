import { Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { somenteDigitos } from '../../core/utils/documento-validator';

/**
 * Restringe um input de texto a dígitos (digitação e colagem), preservando zeros à esquerda.
 * O valor do modelo permanece string; `appSomenteDigitos` opcionalmente limita a quantidade.
 */
@Directive({
  selector: 'input[appSomenteDigitos]',
  standalone: true,
  host: { inputmode: 'numeric', autocomplete: 'off' },
})
export class SomenteDigitosDirective {
  @Input() appSomenteDigitos: number | string | '' = '';

  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private readonly ngControl: NgControl | null,
  ) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const limite = Number(this.appSomenteDigitos) || undefined;
    const limpo = somenteDigitos(input.value).slice(0, limite);
    if (limpo === input.value) return;
    input.value = limpo;
    this.ngControl?.control?.setValue(limpo, { emitModelToViewChange: false });
    this.ngControl?.viewToModelUpdate(limpo);
  }
}
