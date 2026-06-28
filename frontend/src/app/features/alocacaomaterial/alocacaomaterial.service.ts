import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { AlocacaoMaterial } from './alocacaomaterial.model';

@Injectable({ providedIn: 'root' })
export class AlocacaoMaterialService {
  private base = `${environment.apiUrl}/alocacaomaterial`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<AlocacaoMaterial>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<AlocacaoMaterial>>(this.base, { params });
  }

  getById(idAlocacaoMaterial: number | string): Observable<AlocacaoMaterial> {
    return this.http.get<AlocacaoMaterial>(`${this.base}/${idAlocacaoMaterial}`);
  }

  create(item: AlocacaoMaterial): Observable<AlocacaoMaterial> {
    return this.http.post<AlocacaoMaterial>(this.base, item);
  }

  update(item: AlocacaoMaterial): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idAlocacaoMaterial}`, item);
  }

  delete(idAlocacaoMaterial: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idAlocacaoMaterial}`);
  }
}
