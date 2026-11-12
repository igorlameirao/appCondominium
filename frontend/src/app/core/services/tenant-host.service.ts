import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CondominioPorDominio {
  idCondominio: number;
  nome: string;
}

/** RT-Gerais 13 — identifica o tenant pelo host (campo Dominio do condomínio). */
@Injectable({ providedIn: 'root' })
export class TenantHostService {
  private resolved = false;
  private _idCondominio: number | null = null;
  private _nomeCondominio = '';

  constructor(private http: HttpClient) {}

  get idCondominio(): number | null {
    return this._idCondominio;
  }

  get nomeCondominio(): string {
    return this._nomeCondominio;
  }

  /** Host atual corresponde a um condomínio cadastrado (e não é host da plataforma). */
  get isTenantHost(): boolean {
    return this._idCondominio != null;
  }

  get loginPath(): '/entrar' | '/login' {
    return this.isTenantHost ? '/entrar' : '/login';
  }

  async init(): Promise<void> {
    if (this.resolved || typeof window === 'undefined') return;
    this.resolved = true;

    const host = normalizarHost(window.location.hostname);
    if (!host || ehHostPlataforma(host)) return;

    try {
      const r = await firstValueFrom(
        this.http.get<CondominioPorDominio>(`${environment.apiUrl}/lookup/condominio-por-dominio`, {
          params: { host }
        })
      );
      if (r?.idCondominio) {
        this._idCondominio = r.idCondominio;
        this._nomeCondominio = r.nome ?? '';
      }
    } catch {
      /* domínio não cadastrado — login administrador padrão */
    }
  }
}

function normalizarHost(host: string): string {
  let h = host.trim().toLowerCase();
  if (h.startsWith('http://')) h = h.slice(7);
  else if (h.startsWith('https://')) h = h.slice(8);
  const path = h.indexOf('/');
  if (path >= 0) h = h.slice(0, path);
  const port = h.indexOf(':');
  if (port > 0) h = h.slice(0, port);
  if (h.startsWith('www.')) h = h.slice(4);
  return h;
}

function ehHostPlataforma(host: string): boolean {
  const lista = environment.platformHosts ?? ['localhost', '127.0.0.1'];
  return lista.some(p => normalizarHost(p) === host);
}
