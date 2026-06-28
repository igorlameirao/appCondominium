import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Endereco } from './endereco.model';

@Injectable({ providedIn: 'root' })
export class EnderecoService {
  private base = `${environment.apiUrl}/endereco`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Endereco>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Endereco>>(this.base, { params });
  }

  getById(idEndereco: number | string): Observable<Endereco> {
    return this.http.get<Endereco>(`${this.base}/${idEndereco}`);
  }

  create(item: Endereco): Observable<Endereco> {
    return this.http.post<Endereco>(this.base, item);
  }

  update(item: Endereco): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idEndereco}`, item);
  }

  delete(idEndereco: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idEndereco}`);
  }
}
