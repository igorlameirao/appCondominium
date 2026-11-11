import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage, ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-push-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.current$ | async; as current) {
      <div
        class="push-toast"
        role="alert"
        [class.push-toast--success]="current.variant === 'success'"
        [class.push-toast--warning]="current.variant === 'warning'"
        [class.push-toast--error]="current.variant === 'error'"
        [class.push-toast--info]="!current.variant || current.variant === 'info'"
        [class.push-toast--clickable]="!!current.pushData"
        (click)="onClick(current)"
      >
        <div class="push-toast__icon" aria-hidden="true">
          @switch (current.variant) {
            @case ('success') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12.5l2.5 2.5L16 9"/>
              </svg>
            }
            @case ('warning') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            }
            @case ('error') {
              <!-- Material Icons "block" -->
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z"/>
              </svg>
            }
            @default {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            }
          }
        </div>
        <div class="push-toast__content">
          <div class="push-toast__title">{{ current.title }}</div>
          @if (current.body) {
            <div class="push-toast__body">{{ current.body }}</div>
          }
          @if (current.pushData) {
            <div class="push-toast__hint">Clique para abrir</div>
          }
        </div>
        <button
          type="button"
          class="push-toast__close"
          (click)="dismiss($event)"
          aria-label="Fechar notificação"
          title="Fechar"
        >
          ✕
        </button>
      </div>
    }
  `,
  styles: [`
    .push-toast {
      position: fixed;
      top: 16px;
      right: 16px;
      bottom: auto;
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: min(420px, calc(100vw - 32px));
      padding: 14px 44px 14px 14px;
      color: #f8fafc;
      border-radius: 10px;
      font-size: 13px;
      white-space: pre-line;
      animation: push-toast-slide-in 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.28);
    }
    .push-toast--info {
      background: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .push-toast--success {
      background: #14532d;
      border: 1px solid rgba(187, 247, 208, 0.4);
      box-shadow: 0 8px 24px rgba(20, 83, 45, 0.4);
    }
    .push-toast--warning {
      background: #78350f;
      border: 1px solid rgba(253, 230, 138, 0.45);
      box-shadow: 0 8px 24px rgba(120, 53, 15, 0.4);
    }
    .push-toast--error {
      background: #7f1d1d;
      border: 1px solid rgba(254, 202, 202, 0.35);
      box-shadow: 0 8px 24px rgba(127, 29, 29, 0.4);
    }
    @keyframes push-toast-slide-in {
      from {
        opacity: 0;
        transform: translateX(110%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .push-toast--clickable {
      cursor: pointer;
    }
    .push-toast--info.push-toast--clickable:hover { background: #1e293b; }
    .push-toast--success.push-toast--clickable:hover { background: #166534; }
    .push-toast--warning.push-toast--clickable:hover { background: #92400e; }
    .push-toast--error.push-toast--clickable:hover { background: #991b1b; }
    .push-toast__icon {
      flex: 0 0 auto;
      width: 22px;
      height: 22px;
      margin-top: 1px;
    }
    .push-toast__icon svg {
      display: block;
      width: 22px;
      height: 22px;
    }
    .push-toast--success .push-toast__icon { color: #86efac; }
    .push-toast--warning .push-toast__icon { color: #fde047; }
    .push-toast--error .push-toast__icon { color: #fca5a5; }
    .push-toast--info .push-toast__icon { color: #93c5fd; }
    .push-toast__content {
      flex: 1 1 auto;
      min-width: 0;
    }
    .push-toast__title {
      font-weight: 700;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .push-toast__body {
      color: #e2e8f0;
      line-height: 1.35;
    }
    .push-toast--success .push-toast__body { color: #bbf7d0; }
    .push-toast--warning .push-toast__body { color: #fde68a; }
    .push-toast--error .push-toast__body { color: #fecaca; }
    .push-toast__hint {
      margin-top: 6px;
      font-size: 11px;
      color: #94a3b8;
    }
    .push-toast__close {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(248, 250, 252, 0.12);
      color: #e2e8f0;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
    }
    .push-toast__close:hover {
      background: rgba(248, 250, 252, 0.22);
      color: #fff;
    }
  `]
})
export class PushToastComponent {
  readonly toast = inject(ToastService);

  dismiss(event: MouseEvent): void {
    event.stopPropagation();
    this.toast.dismiss();
  }

  onClick(current: ToastMessage): void {
    if (current.pushData) return;
    this.toast.dismiss();
  }
}
