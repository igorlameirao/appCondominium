import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PessoaContextoGravacao {
  contextoId: string;
  cpfcnpj?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  nomeFantasia?: string;
  dataFundacao?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  idUnidade?: number | null;
  idPessoaRelacionada?: number | null;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
  dataAdmissao?: string;
  dataDesligamento?: string;
  ctps?: string;
  idFuncaoColaborador?: number | null;
  ctpsArquivoBase64?: string;
  ctpsContentType?: string;
  codigoPapelVinculo?: number;
  tipoColaborador?: 1 | 2;
}

export interface PessoaContextoGravacaoResponse {
  idPessoa: number;
  tipo: 'PF' | 'PJ' | string;
  idVinculo?: number;
  idColaborador?: number;
}

export interface ColaboradorItem {
  idColaborador?: number;
  dataAdmissao?: string;
  dataDesligamento?: string;
  ctps?: string;
  tipoColaborador?: number;
  idFuncaoColaborador?: number;
  funcaoDescricao?: string;
  ativo: boolean;
  possuiArquivoCtps: boolean;
}

export interface ColaboradorConsulta {
  ativo?: ColaboradorItem | null;
  historico: ColaboradorItem[];
}

@Injectable({ providedIn: 'root' })
export class PessoaContextoApiService {
  private readonly base = `${environment.apiUrl}/pessoas/contexto`;

  constructor(private http: HttpClient) {}

  incluir(body: PessoaContextoGravacao): Observable<PessoaContextoGravacaoResponse> {
    return this.http.post<PessoaContextoGravacaoResponse>(this.base, body);
  }

  alterar(idPessoa: number, body: PessoaContextoGravacao): Observable<PessoaContextoGravacaoResponse> {
    return this.http.put<PessoaContextoGravacaoResponse>(`${this.base}/${idPessoa}`, body);
  }

  colaborador(idPessoa: number, contextoId: string): Observable<ColaboradorConsulta> {
    const params = new HttpParams().set('contexto', contextoId);
    return this.http.get<ColaboradorConsulta>(`${this.base}/${idPessoa}/colaborador`, { params });
  }
}
