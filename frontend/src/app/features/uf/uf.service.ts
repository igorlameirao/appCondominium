import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { UF } from './uf.model';

@Injectable({ providedIn: 'root' })
export class UFService {
  private base = `${environment.apiUrl}/uf`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<UF>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<UF>>(this.base, { params });
  }

  getById(siglaUF: number | string): Observable<UF> {
    return this.http.get<UF>(`${this.base}/${siglaUF}`);
  }

  create(item: UF): Observable<UF> {
    return this.http.post<UF>(this.base, item);
  }

  update(item: UF): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.siglaUF}`, item);
  }

  delete(siglaUF: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${siglaUF}`);
  }
}
