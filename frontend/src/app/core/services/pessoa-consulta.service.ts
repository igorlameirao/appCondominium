import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result';

export interface PessoaListagemItem {
  idPessoa: number;
  tipo: string;
  nome: string;
  cpfcnpj?: string;
  complemento?: string;
  situacaoVinculo: string;
  papelResumo?: string;
  unidadeResumo?: string;
  idVinculoPrincipal?: number;
  codigoPapelVinculo?: number;
}

export interface PessoaPorDocumento {
  idPessoa: number;
  ehPessoaJuridica: boolean;
  nome?: string;
  cpfcnpj?: string;
  telefone?: string;
  email?: string;
  nomeFantasia?: string;
  dataNascimento?: string;
  dataFundacao?: string;
  idResponsavel?: number;
}

@Injectable({ providedIn: 'root' })
export class PessoaConsultaService {
  private readonly base = `${environment.apiUrl}/pessoas`;

  constructor(private http: HttpClient) {}

  listar(
    page: number,
    pageSize: number,
    filter?: string,
    tipo?: 'PF' | 'PJ' | '',
    situacao?: 'ativo' | 'encerrado' | '',
    contexto?: string
  ): Observable<PagedResult<PessoaListagemItem>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filter) params = params.set('filter', filter);
    if (tipo) params = params.set('tipo', tipo);
    if (situacao) params = params.set('situacao', situacao);
    if (contexto) params = params.set('contexto', contexto);
    return this.http.get<PagedResult<PessoaListagemItem>>(this.base, { params });
  }

  porDocumento(cpfcnpj: string, finalidade?: 'cadastro'): Observable<PessoaPorDocumento> {
    let params = new HttpParams().set('cpfcnpj', cpfcnpj);
    if (finalidade) params = params.set('finalidade', finalidade);
    return this.http.get<PessoaPorDocumento>(`${this.base}/por-documento`, { params });
  }
}