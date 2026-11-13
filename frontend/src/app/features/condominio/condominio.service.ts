import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Condominio } from './condominio.model';

@Injectable({ providedIn: 'root' })
export class CondominioService {
  private base = `${environment.apiUrl}/condominio`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Condominio>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Condominio>>(this.base, { params }).pipe(
      map((r) => ({
        ...r,
        items: (r.items ?? []).map((item) => normalizarCondominioListagem(item)),
      }))
    );
  }

  getById(idCondominio: number | string): Observable<Condominio> {
    return this.http.get<Condominio>(`${this.base}/${idCondominio}`);
  }

  create(item: Condominio): Observable<Condominio> {
    return this.http.post<Condominio>(this.base, item);
  }

  update(item: Condominio): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idCondominio}`, item);
  }

  delete(idCondominio: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idCondominio}`);
  }
}

/** Garante camelCase dos campos de endereço enriquecidos na listagem. */
function normalizarCondominioListagem(raw: Condominio): Condominio {
  const extra = raw as Condominio & {
    EnderecoLogradouro?: string;
    NomeBairro?: string;
    NomeMunicipio?: string;
    SiglaUf?: string;
    siglaUF?: string;
  };
  return {
    ...raw,
    enderecoLogradouro: extra.enderecoLogradouro ?? extra.EnderecoLogradouro,
    nomeBairro: extra.nomeBairro ?? extra.NomeBairro,
    nomeMunicipio: extra.nomeMunicipio ?? extra.NomeMunicipio,
    siglaUf: extra.siglaUf ?? extra.SiglaUf ?? extra.siglaUF,
    dominio: raw.dominio ?? (raw as { Dominio?: string }).Dominio,
  };
}
