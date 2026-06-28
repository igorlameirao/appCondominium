import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { EntradaSaidaMaterialConsumo } from './entradasaidamaterialconsumo.model';

@Injectable({ providedIn: 'root' })
export class EntradaSaidaMaterialConsumoService {
  private base = `${environment.apiUrl}/entradasaidamaterialconsumo`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<EntradaSaidaMaterialConsumo>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<EntradaSaidaMaterialConsumo>>(this.base, { params });
  }

  getById(idEntradaSaidaMaterialConsumo: number | string): Observable<EntradaSaidaMaterialConsumo> {
    return this.http.get<EntradaSaidaMaterialConsumo>(`${this.base}/${idEntradaSaidaMaterialConsumo}`);
  }

  create(item: EntradaSaidaMaterialConsumo): Observable<EntradaSaidaMaterialConsumo> {
    return this.http.post<EntradaSaidaMaterialConsumo>(this.base, item);
  }

  update(item: EntradaSaidaMaterialConsumo): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idEntradaSaidaMaterialConsumo}`, item);
  }

  delete(idEntradaSaidaMaterialConsumo: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idEntradaSaidaMaterialConsumo}`);
  }
}
