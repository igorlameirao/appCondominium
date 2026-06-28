import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Local } from './local.model';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private base = `${environment.apiUrl}/local`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Local>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Local>>(this.base, { params });
  }

  getById(idLocal: number | string): Observable<Local> {
    return this.http.get<Local>(`${this.base}/${idLocal}`);
  }

  create(item: Local): Observable<Local> {
    return this.http.post<Local>(this.base, item);
  }

  update(item: Local): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idLocal}`, item);
  }

  delete(idLocal: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idLocal}`);
  }
}
