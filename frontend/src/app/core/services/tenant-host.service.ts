import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isReservedTenantSlug } from '../tenancy/tenant-route.constants';
import { firstPathSegment } from '../tenancy/tenant-url.util';

export interface CondominioPorIdentificador {
  idCondominio: number;
  nome: string;
  identificadorUrl?: string;
}

/**
 * RT-Gerais 13 — identifica o tenant pelo primeiro segmento da URL (campo Dominio do condomínio).
 */
@Injectable({ providedIn: 'root' })
export class TenantHostService {
  private resolved = false;
  private _idCondominio: number | null = null;
  private _nomeCondominio = '';
  private _urlSlug: string | null = null;

  constructor(private http: HttpClient) {}

  get idCondominio(): number | null {
    return this._idCondominio;
  }

  get nomeCondominio(): string {
    return this._nomeCondominio;
  }

  /** Slug do primeiro segmento da URL quando o condomínio foi resolvido no backend. */
  get urlSlug(): string | null {
    return this._urlSlug;
  }

  /** Contexto de acesso por URL do condomínio (app.../identificador/...). */
  get isTenantHost(): boolean {
    return this._urlSlug != null && this._idCondominio != null;
  }

  get loginPath(): '/entrar' | '/login' {
    return this.isTenantHost ? '/entrar' : '/login';
  }

  async init(): Promise<void> {
    if (this.resolved || typeof window === 'undefined') return;
    this.resolved = true;
    const segment = firstPathSegment(window.location.pathname);
    if (!segment || isReservedTenantSlug(segment)) return;
    await this.resolveBySlug(segment);
  }

  async resolveBySlug(slug: string): Promise<boolean> {
    const normalizado = slug.trim().toLowerCase();
    if (!normalizado || isReservedTenantSlug(normalizado)) return false;

    try {
      const r = await firstValueFrom(
        this.http.get<CondominioPorIdentificador>(`${environment.apiUrl}/lookup/condominio-por-dominio`, {
          params: { slug: normalizado }
        })
      );
      if (r?.idCondominio) {
        this._urlSlug = normalizado;
        this._idCondominio = r.idCondominio;
        this._nomeCondominio = r.nome ?? '';
        return true;
      }
    } catch {
      /* identificador não cadastrado */
    }
    return false;
  }

  async slugForCondominio(idCondominio: number): Promise<string | null> {
    try {
      const r = await firstValueFrom(
        this.http.get<{ dominio?: string }>(`${environment.apiUrl}/lookup/condominio-resumo/${idCondominio}`)
      );
      const slug = r?.dominio?.trim().toLowerCase();
      return slug || null;
    } catch {
      return null;
    }
  }
}