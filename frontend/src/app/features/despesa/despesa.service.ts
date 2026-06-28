import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Despesa } from './despesa.model';

@Injectable({ providedIn: 'root' })
export class DespesaService {
  private base = `${environment.apiUrl}/despesa`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Despesa>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Despesa>>(this.base, { params });
  }

  getById(idDespesa: number | string): Observable<Despesa> {
    return this.http.get<Despesa>(`${this.base}/${idDespesa}`);
  }

  create(item: Despesa): Observable<Despesa> {
    return this.http.post<Despesa>(this.base, item);
  }

  update(item: Despesa): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idDespesa}`, item);
  }

  delete(idDespesa: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idDespesa}`);
  }
}
