import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfiguracaoEmail,
  ConfiguracaoEmailUpsert,
  EmailTesteConexaoResultado,
  EmailTesteEnvioResultado
} from './configuracao-email.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoEmailService {
  private readonly base = `${environment.apiUrl}/configuracao-email`;

  constructor(private http: HttpClient) {}

  obter(): Observable<ConfiguracaoEmail> {
    return this.http.get<ConfiguracaoEmail>(this.base);
  }

  salvar(dto: ConfiguracaoEmailUpsert): Observable<ConfiguracaoEmail> {
    return this.http.put<ConfiguracaoEmail>(this.base, dto);
  }

  testarConexao(): Observable<EmailTesteConexaoResultado> {
    return this.http.post<EmailTesteConexaoResultado>(`${this.base}/testar-conexao`, {});
  }

  enviarTeste(destinatario: string): Observable<EmailTesteEnvioResultado> {
    return this.http.post<EmailTesteEnvioResultado>(`${this.base}/enviar-teste`, { destinatario });
  }
}