import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Bairro } from './bairro.model';

@Injectable({ providedIn: 'root' })
export class BairroService {
  private base = `${environment.apiUrl}/bairro`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Bairro>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Bairro>>(this.base, { params });
  }

  getById(idBairro: number | string): Observable<Bairro> {
    return this.http.get<Bairro>(`${this.base}/${idBairro}`);
  }

  create(item: Bairro): Observable<Bairro> {
    return this.http.post<Bairro>(this.base, item);
  }

  update(item: Bairro): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idBairro}`, item);
  }

  delete(idBairro: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idBairro}`);
  }
}
