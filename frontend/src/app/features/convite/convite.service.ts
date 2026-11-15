import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConviteListItem {
  idConvite: number;
  emailMascarado: string;
  cpfMascarado?: string;
  tipoConvite: number;
  estado: number;
  estadoEnvioEmail: number;
  dataEmissao: string;
  dataExpiracao: string;
  dataAceite?: string;
  nomeCondominio?: string;
  idVinculoCriado?: number;
}

export interface EmitirConviteBody {
  email: string;
  cpf?: string;
  codigoPapelVinculo: number;
  idPerfil?: number;
  idUnidade?: number;
  idPessoaRelacionada?: number;
  idPessoaDestinatario?: number;
  observacao?: string;
}

export interface ValidarConviteResponse {
  valido: boolean;
  codigo: string;
  mensagem: string;
  tipoConvite?: number;
  requerAutenticacao: boolean;
  requerDefinirSenha: boolean;
  nomeCondominio?: string;
  emailMascarado?: string;
  dataExpiracao?: string;
}

@Injectable({ providedIn: 'root' })
export class ConviteService {
  private readonly base = `${environment.apiUrl}/convites`;

  constructor(private readonly http: HttpClient) {}

  listar(email?: string): Observable<ConviteListItem[]> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    return this.http.get<ConviteListItem[]>(this.base, { params });
  }

  emitir(body: EmitirConviteBody): Observable<{ idConvite: number; estadoEnvioEmail: number; mensagem: string }> {
    return this.http.post<{ idConvite: number; estadoEnvioEmail: number; mensagem: string }>(this.base, body);
  }

  reenviar(idConvite: number): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.base}/${idConvite}/reenviar`, {});
  }

  revogar(idConvite: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${idConvite}/revogar`, {});
  }

  validar(token: string): Observable<ValidarConviteResponse> {
    return this.http.get<ValidarConviteResponse>(`${this.base}/validar`, { params: { token } });
  }

  aceitarContaNova(body: Record<string, unknown>): Observable<{ sucesso: boolean; mensagem: string }> {
    return this.http.post<{ sucesso: boolean; mensagem: string }>(`${this.base}/aceitar`, body);
  }

  aceitarAutenticado(token: string): Observable<{ sucesso: boolean; mensagem: string }> {
    return this.http.post<{ sucesso: boolean; mensagem: string }>(`${this.base}/aceitar`, { token, modo: 'autenticado' });
  }
}