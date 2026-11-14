import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { TipoUnidade } from './tipounidade.model';

@Injectable({ providedIn: 'root' })
export class TipoUnidadeService {
  private base = `${environment.apiUrl}/tipounidade`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<TipoUnidade>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<TipoUnidade>>(this.base, { params });
  }

  getById(idTipoUnidade: number | string): Observable<TipoUnidade> {
    return this.http.get<TipoUnidade>(`${this.base}/${idTipoUnidade}`);
  }

  create(item: TipoUnidade): Observable<TipoUnidade> {
    return this.http.post<TipoUnidade>(this.base, item);
  }

  update(item: TipoUnidade): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idTipoUnidade}`, item);
  }

  delete(idTipoUnidade: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idTipoUnidade}`);
  }
}
