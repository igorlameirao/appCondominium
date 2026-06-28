import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Pessoafisica } from './pessoafisica.model';

@Injectable({ providedIn: 'root' })
export class PessoafisicaService {
  private base = `${environment.apiUrl}/pessoafisica`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Pessoafisica>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Pessoafisica>>(this.base, { params });
  }

  getById(idPessoa: number | string): Observable<Pessoafisica> {
    return this.http.get<Pessoafisica>(`${this.base}/${idPessoa}`);
  }

  create(item: Pessoafisica): Observable<Pessoafisica> {
    return this.http.post<Pessoafisica>(this.base, item);
  }

  update(item: Pessoafisica): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idPessoa}`, item);
  }

  delete(idPessoa: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idPessoa}`);
  }
}
