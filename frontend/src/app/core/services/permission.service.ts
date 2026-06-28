import { Injectable } from '@angular/core';

/** RT-Gerais 09/10 — controle simplificado por perfil até RBAC completo. */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  get perfil(): string {
    return sessionStorage.getItem('perfil') ?? '';
  }

  canEdit(): boolean {
    const p = this.perfil.toLowerCase();
    return !p || p.includes('admin') || p.includes('síndico') || p.includes('sindico') || p.includes('funcionário');
  }

  canDelete(): boolean {
    const p = this.perfil.toLowerCase();
    return p.includes('admin') || p.includes('síndico') || p.includes('sindico');
  }
}
