import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { AutorizacaoAcessoTemporario } from './autorizacaoacessotemporario.model';

@Injectable({ providedIn: 'root' })
export class AutorizacaoAcessoTemporarioService {
  private base = `${environment.apiUrl}/autorizacaoacessotemporario`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<AutorizacaoAcessoTemporario>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<AutorizacaoAcessoTemporario>>(this.base, { params });
  }

  getById(idAutorizacao: number | string): Observable<AutorizacaoAcessoTemporario> {
    return this.http.get<AutorizacaoAcessoTemporario>(`${this.base}/${idAutorizacao}`);
  }

  create(item: AutorizacaoAcessoTemporario): Observable<AutorizacaoAcessoTemporario> {
    return this.http.post<AutorizacaoAcessoTemporario>(this.base, item);
  }

  update(item: AutorizacaoAcessoTemporario): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idAutorizacao}`, item);
  }

  delete(idAutorizacao: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idAutorizacao}`);
  }
}
