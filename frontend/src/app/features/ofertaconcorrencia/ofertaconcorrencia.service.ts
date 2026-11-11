import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { OfertaConcorrencia } from './ofertaconcorrencia.model';

@Injectable({ providedIn: 'root' })
export class OfertaConcorrenciaService {
  private base = `${environment.apiUrl}/ofertaconcorrencia`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<OfertaConcorrencia>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<OfertaConcorrencia>>(this.base, { params });
  }

  getById(idOfertaConcorrencia: number | string): Observable<OfertaConcorrencia> {
    return this.http.get<OfertaConcorrencia>(`${this.base}/${idOfertaConcorrencia}`);
  }

  create(item: OfertaConcorrencia): Observable<OfertaConcorrencia> {
    return this.http.post<OfertaConcorrencia>(this.base, item);
  }

  update(item: OfertaConcorrencia): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idOfertaConcorrencia}`, item);
  }

  delete(idOfertaConcorrencia: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idOfertaConcorrencia}`);
  }

  private documentoUrl(id: number | string): string {
    return `${this.base}/${id}/documento-comprobatorio`;
  }

  temDocumento(id: number | string): Observable<void> {
    return this.http.head<void>(this.documentoUrl(id));
  }

  baixarDocumento(id: number | string): Observable<Blob> {
    return this.http.get(this.documentoUrl(id), { responseType: 'blob' });
  }

  enviarDocumento(id: number | string, arquivo: File): Observable<void> {
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    return this.http.put<void>(this.documentoUrl(id), dados);
  }

  removerDocumento(id: number | string): Observable<void> {
    return this.http.delete<void>(this.documentoUrl(id));
  }
}
