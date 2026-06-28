import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { TipoMaterial } from './tipomaterial.model';

@Injectable({ providedIn: 'root' })
export class TipoMaterialService {
  private base = `${environment.apiUrl}/tipomaterial`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<TipoMaterial>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<TipoMaterial>>(this.base, { params });
  }

  getById(idTipoMaterial: number | string): Observable<TipoMaterial> {
    return this.http.get<TipoMaterial>(`${this.base}/${idTipoMaterial}`);
  }

  create(item: TipoMaterial): Observable<TipoMaterial> {
    return this.http.post<TipoMaterial>(this.base, item);
  }

  update(item: TipoMaterial): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idTipoMaterial}`, item);
  }

  delete(idTipoMaterial: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idTipoMaterial}`);
  }
}
