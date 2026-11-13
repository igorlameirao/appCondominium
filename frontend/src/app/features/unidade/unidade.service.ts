import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';
import { Unidade } from './unidade.model';

export interface BlocoComUnidades {
  idBloco: number;
  descricao?: string;
}

export interface UnidadeCopiaLinha {
  numero?: number;
  idTipoUnidadeOrigem?: number;
  tipoUnidadeOrigem?: string;
  idTipoUnidadeDestino?: number;
  tipoUnidadeDestino?: string;
  idUnidadeDestino?: number;
}

export interface CopiarBlocoPrevia {
  criar: UnidadeCopiaLinha[];
  alterar: UnidadeCopiaLinha[];
  ignorar: UnidadeCopiaLinha[];
}

export interface CopiarBlocoResult {
  criadas: number;
  alteradas: number;
  ignoradas: number;
}

@Injectable({ providedIn: 'root' })
export class UnidadeService {
  private base = `${environment.apiUrl}/unidade`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<Unidade>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<Unidade>>(this.base, { params });
  }

  getById(idUnidade: number | string): Observable<Unidade> {
    return this.http.get<Unidade>(`${this.base}/${idUnidade}`);
  }

  create(item: Unidade): Observable<Unidade> {
    return this.http.post<Unidade>(this.base, item);
  }

  update(item: Unidade): Observable<void> {
    return this.http.put<void>(`${this.base}/${item.idUnidade}`, item);
  }

  delete(idUnidade: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${idUnidade}`);
  }

  getBlocosComUnidades(): Observable<BlocoComUnidades[]> {
    return this.http.get<BlocoComUnidades[]>(`${this.base}/blocos-com-unidades`);
  }

  previaCopiarBloco(idBlocoOrigem: number, idBlocoDestino: number): Observable<CopiarBlocoPrevia> {
    const params = new HttpParams()
      .set('idBlocoOrigem', idBlocoOrigem)
      .set('idBlocoDestino', idBlocoDestino);
    return this.http.get<CopiarBlocoPrevia>(`${this.base}/copiar-bloco/previa`, { params });
  }

  copiarBloco(idBlocoOrigem: number, idBlocoDestino: number): Observable<CopiarBlocoResult> {
    return this.http.post<CopiarBlocoResult>(`${this.base}/copiar-bloco`, { idBlocoOrigem, idBlocoDestino });
  }
}
