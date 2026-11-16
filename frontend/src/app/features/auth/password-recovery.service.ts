import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitarRecuperacaoResponse {
  mensagem: string;
}

export interface ValidarRecuperacaoResponse {
  valido: boolean;
  codigo: string;
  mensagem: string;
}

export interface RedefinirSenhaResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly base = `${environment.apiUrl}/auth/recuperacao-senha`;

  constructor(private readonly http: HttpClient) {}

  solicitar(email: string): Observable<SolicitarRecuperacaoResponse> {
    return this.http.post<SolicitarRecuperacaoResponse>(`${this.base}/solicitar`, { email });
  }

  validar(token: string): Observable<ValidarRecuperacaoResponse> {
    return this.http.get<ValidarRecuperacaoResponse>(`${this.base}/validar`, {
      params: { token }
    });
  }

  redefinir(token: string, senhaNova: string, senhaConfirmacao: string): Observable<RedefinirSenhaResponse> {
    return this.http.post<RedefinirSenhaResponse>(`${this.base}/redefinir`, {
      token,
      senhaNova,
      senhaConfirmacao
    });
  }
}