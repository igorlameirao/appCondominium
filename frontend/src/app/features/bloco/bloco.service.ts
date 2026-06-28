import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Bloco } from './bloco.model';

@Injectable({ providedIn: 'root' })
export class BlocoService {
  private base = `${environment.apiUrl}/bloco`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Bloco>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Bloco>>(this.base, { params });
  }

  getById(idBloco: number | string): Observable<Bloco> {
    return this.http.get<Bloco>(`${this.base}/${idBloco}`);
  }

  create(item: Bloco): Observable<Bloco> {
    return this.http.post<Bloco>(this.base, item);
  }

  update(item: Bloco): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idBloco}`, item);
  }

  delete(idBloco: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idBloco}`);
  }
}
