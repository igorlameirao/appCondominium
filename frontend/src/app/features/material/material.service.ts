import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Material } from './material.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private base = `${environment.apiUrl}/material`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Material>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Material>>(this.base, { params });
  }

  getById(idMaterial: number | string): Observable<Material> {
    return this.http.get<Material>(`${this.base}/${idMaterial}`);
  }

  create(item: Material): Observable<Material> {
    return this.http.post<Material>(this.base, item);
  }

  update(item: Material): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idMaterial}`, item);
  }

  delete(idMaterial: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idMaterial}`);
  }
}
