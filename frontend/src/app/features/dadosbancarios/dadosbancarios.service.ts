import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { DadosBancarios } from './dadosbancarios.model';

@Injectable({ providedIn: 'root' })
export class DadosBancariosService {
  private base = `${environment.apiUrl}/dadosbancarios`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<DadosBancarios>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<DadosBancarios>>(this.base, { params });
  }

  getById(conta: number | string, codigoBanco: number | string, agencia: number | string): Observable<DadosBancarios> {
    return this.http.get<DadosBancarios>(`${this.base}/${conta}/${codigoBanco}/${agencia}`);
  }

  create(item: DadosBancarios): Observable<DadosBancarios> {
    return this.http.post<DadosBancarios>(this.base, item);
  }

  update(item: DadosBancarios): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.conta}/${item.codigoBanco}/${item.agencia}`, item);
  }

  delete(conta: number | string, codigoBanco: number | string, agencia: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${conta}/${codigoBanco}/${agencia}`);
  }
}
