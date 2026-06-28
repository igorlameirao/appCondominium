import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Municipio } from './municipio.model';

@Injectable({ providedIn: 'root' })
export class MunicipioService {
  private base = `${environment.apiUrl}/municipio`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Municipio>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Municipio>>(this.base, { params });
  }

  getById(codigoIBGEMunicipio: number | string): Observable<Municipio> {
    return this.http.get<Municipio>(`${this.base}/${codigoIBGEMunicipio}`);
  }

  create(item: Municipio): Observable<Municipio> {
    return this.http.post<Municipio>(this.base, item);
  }

  update(item: Municipio): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.codigoIBGEMunicipio}`, item);
  }

  delete(codigoIBGEMunicipio: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${codigoIBGEMunicipio}`);
  }
}
