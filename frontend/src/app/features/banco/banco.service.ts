import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Banco } from './banco.model';

@Injectable({ providedIn: 'root' })
export class BancoService {
  private base = `${environment.apiUrl}/banco`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Banco>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Banco>>(this.base, { params });
  }

  getById(codigoBanco: number | string): Observable<Banco> {
    return this.http.get<Banco>(`${this.base}/${codigoBanco}`);
  }

  create(item: Banco): Observable<Banco> {
    return this.http.post<Banco>(this.base, item);
  }

  update(item: Banco): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.codigoBanco}`, item);
  }

  delete(codigoBanco: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${codigoBanco}`);
  }
}
