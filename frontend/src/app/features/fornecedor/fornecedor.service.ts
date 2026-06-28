import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Fornecedor } from './fornecedor.model';

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private base = `${environment.apiUrl}/fornecedor`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Fornecedor>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Fornecedor>>(this.base, { params });
  }

  getById(idPessoa: number | string): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.base}/${idPessoa}`);
  }

  create(item: Fornecedor): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(this.base, item);
  }

  update(item: Fornecedor): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idPessoa}`, item);
  }

  delete(idPessoa: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idPessoa}`);
  }
}
