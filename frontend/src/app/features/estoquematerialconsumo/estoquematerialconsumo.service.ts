import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { EstoqueMaterialConsumo } from './estoquematerialconsumo.model';

@Injectable({ providedIn: 'root' })
export class EstoqueMaterialConsumoService {
  private base = `${environment.apiUrl}/estoquematerialconsumo`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<EstoqueMaterialConsumo>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<EstoqueMaterialConsumo>>(this.base, { params });
  }

  getById(idEstoqueMaterialConsumo: number | string): Observable<EstoqueMaterialConsumo> {
    return this.http.get<EstoqueMaterialConsumo>(`${this.base}/${idEstoqueMaterialConsumo}`);
  }

  create(item: EstoqueMaterialConsumo): Observable<EstoqueMaterialConsumo> {
    return this.http.post<EstoqueMaterialConsumo>(this.base, item);
  }

  update(item: EstoqueMaterialConsumo): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idEstoqueMaterialConsumo}`, item);
  }

  delete(idEstoqueMaterialConsumo: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idEstoqueMaterialConsumo}`);
  }
}
