import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  title: string;
  body: string;
  variant?: ToastVariant;
  /** Quando definido, o toast é clicável. */
  pushData?: Record<string, string>;
}

/** Toast global: erros de formulário, sucesso e avisos. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _current = new BehaviorSubject<ToastMessage | null>(null);
  readonly current$ = this._current.asObservable();
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: ToastMessage, durationMs = 6000): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    Promise.resolve().then(() => this._current.next({
      ...message,
      variant: message.variant ?? 'info'
    }));
    if (durationMs > 0) {
      this.dismissTimer = setTimeout(() => this.dismiss(), durationMs);
    }
  }

  showSuccess(message: string, title = 'Sucesso', durationMs = 5000): void {
    const body = (message ?? '').trim();
    if (!body) return;
    this.show({ title, body, variant: 'success' }, durationMs);
  }

  showWarning(message: string, title = 'Aviso', durationMs = 7000): void {
    const body = (message ?? '').trim();
    if (!body) return;
    this.show({ title, body, variant: 'warning' }, durationMs);
  }

  showError(message: string, title = 'Atenção', durationMs = 8000): void {
    const body = (message ?? '').trim();
    if (!body) return;
    this.show({ title, body, variant: 'error' }, durationMs);
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    Promise.resolve().then(() => this._current.next(null));
  }

  get current(): ToastMessage | null {
    return this._current.value;
  }
}
