import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { PessoaVinculo } from './pessoavinculo.model';

@Injectable({ providedIn: 'root' })
export class PessoaVinculoService {
  private base = `${environment.apiUrl}/pessoavinculo`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<PessoaVinculo>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<PessoaVinculo>>(this.base, { params });
  }

  getById(idVinculo: number | string): Observable<PessoaVinculo> {
    return this.http.get<PessoaVinculo>(`${this.base}/${idVinculo}`);
  }

  create(item: PessoaVinculo): Observable<PessoaVinculo> {
    return this.http.post<PessoaVinculo>(this.base, item);
  }

  update(item: PessoaVinculo): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idVinculo}`, item);
  }

  delete(idVinculo: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idVinculo}`);
  }
}
