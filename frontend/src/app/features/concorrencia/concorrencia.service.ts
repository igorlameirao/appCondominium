import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Concorrencia } from './concorrencia.model';

@Injectable({ providedIn: 'root' })
export class ConcorrenciaService {
  private base = `${environment.apiUrl}/concorrencia`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Concorrencia>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Concorrencia>>(this.base, { params });
  }

  getById(idConcorrencia: number | string): Observable<Concorrencia> {
    return this.http.get<Concorrencia>(`${this.base}/${idConcorrencia}`);
  }

  create(item: Concorrencia): Observable<Concorrencia> {
    return this.http.post<Concorrencia>(this.base, item);
  }

  update(item: Concorrencia): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idConcorrencia}`, item);
  }

  delete(idConcorrencia: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idConcorrencia}`);
  }
}
