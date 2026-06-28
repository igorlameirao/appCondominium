import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { ConsumoAgua } from './consumoagua.model';

@Injectable({ providedIn: 'root' })
export class ConsumoAguaService {
  private base = `${environment.apiUrl}/consumoagua`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<ConsumoAgua>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<ConsumoAgua>>(this.base, { params });
  }

  getById(idConsumo: number | string): Observable<ConsumoAgua> {
    return this.http.get<ConsumoAgua>(`${this.base}/${idConsumo}`);
  }

  create(item: ConsumoAgua): Observable<ConsumoAgua> {
    return this.http.post<ConsumoAgua>(this.base, item);
  }

  update(item: ConsumoAgua): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idConsumo}`, item);
  }

  delete(idConsumo: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idConsumo}`);
  }
}
