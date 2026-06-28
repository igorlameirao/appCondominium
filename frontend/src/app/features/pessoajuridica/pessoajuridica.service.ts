import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { PessoaJuridica } from './pessoajuridica.model';

@Injectable({ providedIn: 'root' })
export class PessoaJuridicaService {
  private base = `${environment.apiUrl}/pessoajuridica`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<PessoaJuridica>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<PessoaJuridica>>(this.base, { params });
  }

  getById(idPessoa: number | string): Observable<PessoaJuridica> {
    return this.http.get<PessoaJuridica>(`${this.base}/${idPessoa}`);
  }

  create(item: PessoaJuridica): Observable<PessoaJuridica> {
    return this.http.post<PessoaJuridica>(this.base, item);
  }

  update(item: PessoaJuridica): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idPessoa}`, item);
  }

  delete(idPessoa: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idPessoa}`);
  }
}
