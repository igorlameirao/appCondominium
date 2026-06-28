import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Hidrometro } from './hidrometro.model';

@Injectable({ providedIn: 'root' })
export class HidrometroService {
  private base = `${environment.apiUrl}/hidrometro`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Hidrometro>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Hidrometro>>(this.base, { params });
  }

  getById(idHidrometro: number | string): Observable<Hidrometro> {
    return this.http.get<Hidrometro>(`${this.base}/${idHidrometro}`);
  }

  create(item: Hidrometro): Observable<Hidrometro> {
    return this.http.post<Hidrometro>(this.base, item);
  }

  update(item: Hidrometro): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idHidrometro}`, item);
  }

  delete(idHidrometro: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idHidrometro}`);
  }
}
