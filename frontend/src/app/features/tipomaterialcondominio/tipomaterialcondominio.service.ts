import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { TipoMaterialCondominio } from './tipomaterialcondominio.model';

@Injectable({ providedIn: 'root' })
export class TipoMaterialCondominioService {
  private base = `${environment.apiUrl}/tipomaterialcondominio`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<TipoMaterialCondominio>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<TipoMaterialCondominio>>(this.base, { params });
  }

  getById(idTipoMaterial: number | string, idCondominio: number | string): Observable<TipoMaterialCondominio> {
    return this.http.get<TipoMaterialCondominio>(`${this.base}/${idTipoMaterial}/${idCondominio}`);
  }

  create(item: TipoMaterialCondominio): Observable<TipoMaterialCondominio> {
    return this.http.post<TipoMaterialCondominio>(this.base, item);
  }

  update(item: TipoMaterialCondominio): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idTipoMaterial}/${item.idCondominio}`, item);
  }

  delete(idTipoMaterial: number | string, idCondominio: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idTipoMaterial}/${idCondominio}`);
  }
}
