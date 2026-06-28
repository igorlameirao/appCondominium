import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Cobranca } from './cobranca.model';

@Injectable({ providedIn: 'root' })
export class CobrancaService {
  private base = `${environment.apiUrl}/cobranca`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Cobranca>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Cobranca>>(this.base, { params });
  }

  getById(idCobranca: number | string): Observable<Cobranca> {
    return this.http.get<Cobranca>(`${this.base}/${idCobranca}`);
  }

  create(item: Cobranca): Observable<Cobranca> {
    return this.http.post<Cobranca>(this.base, item);
  }

  update(item: Cobranca): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idCobranca}`, item);
  }

  delete(idCobranca: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idCobranca}`);
  }
}
