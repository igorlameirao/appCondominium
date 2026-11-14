import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

/** Viewport do card: o slide fica aqui e o restante da página não se move. */
@Component({
  selector: 'app-login-passos',
  standalone: true,
  host: { style: 'display:block;width:100%;min-width:0' },
  template: `
    <div class="login-steps-viewport">
      <div
        #trilha
        class="login-steps-track"
        [class.login-steps-track--instant]="semTransicao"
        [style.margin-left]="deslocamento"
        (transitionend)="fimTransicao.emit($event)">
        <ng-content />
      </div>
    </div>
  `
})
export class LoginPassosComponent implements AfterViewInit {
  @Input() deslocamento = '0%';
  @Input() semTransicao = false;
  @Output() fimTransicao = new EventEmitter<TransitionEvent>();
  @Output() elemento = new EventEmitter<HTMLElement>();

  @ViewChild('trilha') trilha?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    if (this.trilha) this.elemento.emit(this.trilha.nativeElement);
  }
}
