import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { TipoAtividadeEconomica } from './tipoatividadeeconomica.model';

@Injectable({ providedIn: 'root' })
export class TipoAtividadeEconomicaService {
  private base = `${environment.apiUrl}/tipoatividadeeconomica`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<TipoAtividadeEconomica>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<TipoAtividadeEconomica>>(this.base, { params });
  }

  getById(codigoTipoAtividadeEconomica: number | string): Observable<TipoAtividadeEconomica> {
    return this.http.get<TipoAtividadeEconomica>(`${this.base}/${codigoTipoAtividadeEconomica}`);
  }

  create(item: TipoAtividadeEconomica): Observable<TipoAtividadeEconomica> {
    return this.http.post<TipoAtividadeEconomica>(this.base, item);
  }

  update(item: TipoAtividadeEconomica): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.codigoTipoAtividadeEconomica}`, item);
  }

  delete(codigoTipoAtividadeEconomica: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${codigoTipoAtividadeEconomica}`);
  }
}
