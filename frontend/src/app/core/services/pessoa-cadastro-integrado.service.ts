import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PessoaFisicaIntegradaRequest {
  cpfcnpj?: string;
  nome?: string;
  telefone?: string;
  dataNascimento?: string;
  email?: string;
  senha?: string;
  fotoPerfilBase64?: string;
  fotoPerfilContentType?: string;
  fotoPerfilRemover?: boolean;
}

export interface PessoaFisicaIntegradaResponse {
  idPessoa: number;
  dados: PessoaFisicaIntegradaRequest;
}

export interface PessoaJuridicaIntegradaRequest {
  cpfcnpj?: string;
  nome?: string;
  telefone?: string;
  nomeFantasia?: string;
  dataFundacao?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  idResponsavel?: number;
}

export interface PessoaJuridicaIntegradaResponse {
  idPessoa: number;
  dados: PessoaJuridicaIntegradaRequest;
}

@Injectable({ providedIn: 'root' })
export class PessoaCadastroIntegradoService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obterPf(idPessoa: number): Observable<PessoaFisicaIntegradaResponse> {
    return this.http.get<PessoaFisicaIntegradaResponse>(`${this.api}/pessoafisica/cadastro-integrado/${idPessoa}`);
  }

  criarPf(body: PessoaFisicaIntegradaRequest): Observable<PessoaFisicaIntegradaResponse> {
    return this.http.post<PessoaFisicaIntegradaResponse>(`${this.api}/pessoafisica/cadastro-integrado`, body);
  }

  atualizarPf(idPessoa: number, body: PessoaFisicaIntegradaRequest): Observable<PessoaFisicaIntegradaResponse> {
    return this.http.put<PessoaFisicaIntegradaResponse>(`${this.api}/pessoafisica/cadastro-integrado/${idPessoa}`, body);
  }

  obterPj(idPessoa: number): Observable<PessoaJuridicaIntegradaResponse> {
    return this.http.get<PessoaJuridicaIntegradaResponse>(`${this.api}/pessoajuridica/cadastro-integrado/${idPessoa}`);
  }

  criarPj(body: PessoaJuridicaIntegradaRequest): Observable<PessoaJuridicaIntegradaResponse> {
    return this.http.post<PessoaJuridicaIntegradaResponse>(`${this.api}/pessoajuridica/cadastro-integrado`, body);
  }

  atualizarPj(idPessoa: number, body: PessoaJuridicaIntegradaRequest): Observable<PessoaJuridicaIntegradaResponse> {
    return this.http.put<PessoaJuridicaIntegradaResponse>(`${this.api}/pessoajuridica/cadastro-integrado/${idPessoa}`, body);
  }
}