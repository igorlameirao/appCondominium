import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../core/models/paged-result';

export interface FornecedorListagemItem {
  idFornecedor: number;
  idPessoa: number;
  nomeExibicao: string;
  cpfcnpj?: string;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class FornecedorListagemService {
  private readonly base = `${environment.apiUrl}/fornecedor/listagem`;

  constructor(private http: HttpClient) {}

  getPaged(page: number, pageSize: number, filter?: string): Observable<PagedResult<FornecedorListagemItem>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    return this.http.get<PagedResult<FornecedorListagemItem>>(this.base, { params });
  }
}