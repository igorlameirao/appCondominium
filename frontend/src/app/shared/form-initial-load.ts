import { Observable, Subscription } from 'rxjs';

/**
 * Segura a tela de aguarde da edição até o registro, os combos e as listas filhas
 * terminarem. Na inclusão, as mesmas chamadas seguem sem o overlay.
 */
export class FormInitialLoad {
  loading = false;
  private pending = 0;
  private editing = false;

  beginEdit(): void {
    this.editing = true;
    this.loading = true;
    this.pending = 0;
  }

  /** Encerra o aguarde quando a edição não disparou nenhuma carga. */
  seal(): void {
    if (this.pending === 0) {
      this.loading = false;
      this.editing = false;
    }
  }

  run<T>(source: Observable<T>, next: (value: T) => void, error?: (err: unknown) => void): Subscription {
    if (!this.editing) {
      return source.subscribe({ next, error });
    }
    this.pending++;
    this.loading = true;
    return source.subscribe({
      next: (value) => {
        try { next(value); } finally { this.finish(); }
      },
      error: (err) => {
        try { error?.(err); } finally { this.finish(); }
      }
    });
  }

  private finish(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) {
      this.loading = false;
      this.editing = false;
    }
  }
}
