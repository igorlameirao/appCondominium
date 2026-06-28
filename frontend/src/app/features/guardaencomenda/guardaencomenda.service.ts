import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { GuardaEncomenda } from './guardaencomenda.model';

@Injectable({ providedIn: 'root' })
export class GuardaEncomendaService {
  private base = `${environment.apiUrl}/guardaencomenda`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<GuardaEncomenda>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<GuardaEncomenda>>(this.base, { params });
  }

  getById(idGuardaEncomenda: number | string): Observable<GuardaEncomenda> {
    return this.http.get<GuardaEncomenda>(`${this.base}/${idGuardaEncomenda}`);
  }

  create(item: GuardaEncomenda): Observable<GuardaEncomenda> {
    return this.http.post<GuardaEncomenda>(this.base, item);
  }

  update(item: GuardaEncomenda): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idGuardaEncomenda}`, item);
  }

  delete(idGuardaEncomenda: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idGuardaEncomenda}`);
  }
}
