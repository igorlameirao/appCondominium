import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { PapelVinculo } from './papelvinculo.model';

@Injectable({ providedIn: 'root' })
export class PapelVinculoService {
  private base = `${environment.apiUrl}/papelvinculo`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<PapelVinculo>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<PapelVinculo>>(this.base, { params });
  }

  getById(codigoPapelVinculo: number | string): Observable<PapelVinculo> {
    return this.http.get<PapelVinculo>(`${this.base}/${codigoPapelVinculo}`);
  }

  create(item: PapelVinculo): Observable<PapelVinculo> {
    return this.http.post<PapelVinculo>(this.base, item);
  }

  update(item: PapelVinculo): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.codigoPapelVinculo}`, item);
  }

  delete(codigoPapelVinculo: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${codigoPapelVinculo}`);
  }
}
