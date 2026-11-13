import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campo-informativo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="cad-informativo">
      <button
        type="button"
        class="cad-informativo__icone"
        [attr.aria-expanded]="aberto"
        [attr.aria-label]="'Informação: ' + texto"
        (click)="alternar($event)">i</button>
      <span *ngIf="aberto" class="cad-informativo__balao" role="tooltip">{{ texto }}</span>
    </span>
  `,
})
export class CampoInformativoComponent {
  @Input({ required: true }) texto = '';

  private readonly host = inject(ElementRef<HTMLElement>);
  aberto = false;

  alternar(ev: Event): void {
    ev.stopPropagation();
    this.aberto = !this.aberto;
  }

  @HostListener('document:click', ['$event'])
  fecharFora(ev: MouseEvent): void {
    if (!this.aberto) return;
    if (!this.host.nativeElement.contains(ev.target as Node))
      this.aberto = false;
  }

  @HostListener('document:keydown.escape')
  fecharEscape(): void {
    this.aberto = false;
  }
}
