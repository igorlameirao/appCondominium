import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { TipoDespesa } from './tipodespesa.model';

@Injectable({ providedIn: 'root' })
export class TipoDespesaService {
  private base = `${environment.apiUrl}/tipodespesa`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<TipoDespesa>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<TipoDespesa>>(this.base, { params });
  }

  getById(idTipoDespesa: number | string): Observable<TipoDespesa> {
    return this.http.get<TipoDespesa>(`${this.base}/${idTipoDespesa}`);
  }

  create(item: TipoDespesa): Observable<TipoDespesa> {
    return this.http.post<TipoDespesa>(this.base, item);
  }

  update(item: TipoDespesa): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idTipoDespesa}`, item);
  }

  delete(idTipoDespesa: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idTipoDespesa}`);
  }
}
