import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { AtividadeEconomica } from './atividadeeconomica.model';

@Injectable({ providedIn: 'root' })
export class AtividadeEconomicaService {
  private base = `${environment.apiUrl}/atividadeeconomica`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<AtividadeEconomica>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<AtividadeEconomica>>(this.base, { params });
  }

  getById(codigoTipoAtividadeEconomica: number | string): Observable<AtividadeEconomica> {
    return this.http.get<AtividadeEconomica>(`${this.base}/${codigoTipoAtividadeEconomica}`);
  }

  create(item: AtividadeEconomica): Observable<AtividadeEconomica> {
    return this.http.post<AtividadeEconomica>(this.base, item);
  }

  update(item: AtividadeEconomica): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.codigoTipoAtividadeEconomica}`, item);
  }

  delete(codigoTipoAtividadeEconomica: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${codigoTipoAtividadeEconomica}`);
  }
}
