import { Injectable } from '@angular/core';

/** RT-Gerais 12 (Regra de Ouro): IdCondominio global do usuário logado. */
@Injectable({ providedIn: 'root' })
export class CondominioContextService {
  private readonly KEY = 'idCondominio';

  get idCondominio(): number | null {
    const v = sessionStorage.getItem(this.KEY);
    return v ? Number(v) : null;
  }

  setCondominio(id: number): void {
    sessionStorage.setItem(this.KEY, String(id));
  }

  clear(): void {
    sessionStorage.removeItem(this.KEY);
  }
}
