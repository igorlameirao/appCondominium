import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Procuração do vínculo pessoa × unidade (S3). Não há tela de CRUD desta entidade. */
@Injectable({ providedIn: 'root' })
export class PessoaUnidadeArquivoService {
  private base = `${environment.apiUrl}/pessoaunidade`;

  constructor(private http: HttpClient) {}

  private url(idPessoa: number, idUnidade: number): string {
    return `${this.base}/${idPessoa}/${idUnidade}/procuracao`;
  }

  temProcuracao(idPessoa: number, idUnidade: number): Observable<void> {
    return this.http.head<void>(this.url(idPessoa, idUnidade));
  }

  baixar(idPessoa: number, idUnidade: number): Observable<Blob> {
    return this.http.get(this.url(idPessoa, idUnidade), { responseType: 'blob' });
  }

  enviar(idPessoa: number, idUnidade: number, arquivo: File): Observable<void> {
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    return this.http.put<void>(this.url(idPessoa, idUnidade), dados);
  }

  remover(idPessoa: number, idUnidade: number): Observable<void> {
    return this.http.delete<void>(this.url(idPessoa, idUnidade));
  }
}
