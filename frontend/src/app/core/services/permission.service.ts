import { Injectable } from '@angular/core';

/** Claims efetivas do condomínio ativo: permissionKey:Acao. */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly claims = new Set<string>();
  acessoTotal = false;

  constructor() {
    this.restore();
  }

  get perfil(): string {
    return sessionStorage.getItem('perfil') ?? '';
  }

  apply(acessoTotal: boolean, permissoes: string[] | null | undefined): void {
    this.acessoTotal = !!acessoTotal;
    this.claims.clear();
    for (const claim of permissoes ?? []) this.claims.add(claim);
    sessionStorage.setItem('acessoTotal', this.acessoTotal ? '1' : '0');
    sessionStorage.setItem('permissoes', JSON.stringify([...this.claims]));
  }

  clear(): void {
    this.acessoTotal = false;
    this.claims.clear();
    sessionStorage.removeItem('acessoTotal');
    sessionStorage.removeItem('permissoes');
  }

  can(permissionKey: string, acao: string): boolean {
    if (this.acessoTotal) return true;
    return this.claims.has(`${permissionKey}:${acao}`);
  }

  private restore(): void {
    this.acessoTotal = sessionStorage.getItem('acessoTotal') === '1';
    const raw = sessionStorage.getItem('permissoes');
    if (!raw) return;
    try {
      const list = JSON.parse(raw) as string[];
      for (const claim of list) this.claims.add(claim);
    } catch {
      this.claims.clear();
    }
  }
}
