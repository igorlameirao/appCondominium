import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { FuncaoColaborador } from './funcaocolaborador.model';

@Injectable({ providedIn: 'root' })
export class FuncaoColaboradorService {
  private base = `${environment.apiUrl}/funcaocolaborador`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<FuncaoColaborador>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<FuncaoColaborador>>(this.base, { params });
  }

  getById(id: number | string): Observable<FuncaoColaborador> {
    return this.http.get<FuncaoColaborador>(`${this.base}/${id}`);
  }

  create(item: FuncaoColaborador): Observable<FuncaoColaborador> {
    return this.http.post<FuncaoColaborador>(this.base, item);
  }

  update(item: FuncaoColaborador): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idFuncaoColaborador}`, item);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
