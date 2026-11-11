import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/** Move o host para document.body para modais fixed não ficarem presos a ancestrais com filter/transform. */
@Directive({
  selector: '[appAnexarAoBody]',
  standalone: true,
})
export class AnexarAoBodyDirective implements OnInit, OnDestroy {
  private readonly elemento = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    document.body.appendChild(this.elemento.nativeElement);
  }

  ngOnDestroy(): void {
    this.elemento.nativeElement.remove();
  }
}
