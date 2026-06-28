import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { ConfiguracaoCondominio } from './configuracaocondominio.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoCondominioService {
  private base = `${environment.apiUrl}/configuracaocondominio`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<ConfiguracaoCondominio>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<ConfiguracaoCondominio>>(this.base, { params });
  }

  getById(idConfiguracao: number | string): Observable<ConfiguracaoCondominio> {
    return this.http.get<ConfiguracaoCondominio>(`${this.base}/${idConfiguracao}`);
  }

  create(item: ConfiguracaoCondominio): Observable<ConfiguracaoCondominio> {
    return this.http.post<ConfiguracaoCondominio>(this.base, item);
  }

  update(item: ConfiguracaoCondominio): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idConfiguracao}`, item);
  }

  delete(idConfiguracao: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idConfiguracao}`);
  }
}
