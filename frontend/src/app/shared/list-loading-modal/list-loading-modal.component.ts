import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnexarAoBodyDirective } from '../foto-perfil/anexar-ao-body.directive';

/** Modal de aguarde — só aparece se a operação demorar além do limiar (evita flash em respostas rápidas). */
@Component({
  selector: 'app-list-loading-modal',
  standalone: true,
  imports: [CommonModule, AnexarAoBodyDirective],
  template: `
    <div
      class="loading-overlay"
      appAnexarAoBody
      *ngIf="showOverlay"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <div class="loading-modal">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p class="loading-text">{{ message }}</p>
      </div>
    </div>
  `,
})
export class ListLoadingModalComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() message = 'Aguarde, carregando a lista...';
  /** Atraso antes de exibir o overlay (ms). */
  @Input() delayMs = 280;

  showOverlay = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(): void {
    if (this.visible) {
      if (this.showOverlay) return;
      this.clearTimer();
      const delay = Math.max(0, this.delayMs);
      if (delay === 0) {
        this.showOverlay = true;
        return;
      }
      this.timer = setTimeout(() => {
        this.showOverlay = true;
        this.timer = null;
      }, delay);
      return;
    }
    this.clearTimer();
    this.showOverlay = false;
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
