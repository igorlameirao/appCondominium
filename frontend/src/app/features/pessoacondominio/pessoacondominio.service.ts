import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { PessoaCondominio } from './pessoacondominio.model';

@Injectable({ providedIn: 'root' })
export class PessoaCondominioService {
  private base = `${environment.apiUrl}/pessoacondominio`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<PessoaCondominio>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<PessoaCondominio>>(this.base, { params });
  }

  getById(idPessoa: number | string, idCondominio: number | string): Observable<PessoaCondominio> {
    return this.http.get<PessoaCondominio>(`${this.base}/${idPessoa}/${idCondominio}`);
  }

  create(item: PessoaCondominio): Observable<PessoaCondominio> {
    return this.http.post<PessoaCondominio>(this.base, item);
  }

  update(item: PessoaCondominio): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idPessoa}/${item.idCondominio}`, item);
  }

  delete(idPessoa: number | string, idCondominio: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idPessoa}/${idCondominio}`);
  }
}
