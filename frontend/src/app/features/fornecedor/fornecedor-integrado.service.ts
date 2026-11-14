import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FornecedorIntegradoRequest {
  idPessoa?: number;
  cpfcnpj?: string;
  nome?: string;
  telefone?: string;
  dataNascimento?: string;
  email?: string;
  nomeFantasia?: string;
  dataFundacao?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  idResponsavel?: number;
  ativo?: boolean;
  criarPapelVinculo?: boolean;
}

export interface FornecedorIntegradoResponse {
  idFornecedor: number;
  idPessoa: number;
  idCondominio: number;
  ehPessoaJuridica: boolean;
  idVinculoFornecedor?: number;
}

@Injectable({ providedIn: 'root' })
export class FornecedorIntegradoService {
  private readonly base = `${environment.apiUrl}/fornecedor/cadastro-integrado`;

  constructor(private http: HttpClient) {}

  obter(idFornecedor: number): Observable<FornecedorIntegradoRequest> {
    return this.http.get<FornecedorIntegradoRequest>(`${this.base}/${idFornecedor}`);
  }

  criar(body: FornecedorIntegradoRequest): Observable<FornecedorIntegradoResponse> {
    return this.http.post<FornecedorIntegradoResponse>(this.base, body);
  }

  atualizar(idFornecedor: number, body: FornecedorIntegradoRequest): Observable<FornecedorIntegradoResponse> {
    return this.http.put<FornecedorIntegradoResponse>(`${this.base}/${idFornecedor}`, body);
  }
}