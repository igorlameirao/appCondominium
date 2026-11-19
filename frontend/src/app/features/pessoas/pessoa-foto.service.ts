import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FotoPerfilStatus {
  temFoto: boolean;
  temEmbedding: boolean;
}

@Injectable({ providedIn: 'root' })
export class PessoaFotoService {
  readonly fotoUrl = signal<string | null>(null);
  readonly status = signal<FotoPerfilStatus | null>(null);

  private fotoObjectUrl: string | null = null;
  private carregandoFoto = false;

  constructor(private http: HttpClient) {}

  carregarStatus(idPessoa: number, contextoId: string): Observable<FotoPerfilStatus> {
    return this.http
      .get<FotoPerfilStatus>(`${environment.apiUrl}/pessoas/contexto/${idPessoa}/foto/status`, {
        params: { contexto: contextoId },
      })
      .pipe(
        tap(s => {
          this.status.set(s);
          if (s.temFoto) this.carregarFoto(idPessoa, contextoId);
          else this.definirFotoUrl(null);
        }),
      );
  }

  carregarFoto(idPessoa: number, contextoId: string): void {
    if (this.carregandoFoto) return;
    this.carregandoFoto = true;
    const bust = Date.now();
    this.http
      .get(`${environment.apiUrl}/pessoas/contexto/${idPessoa}/foto`, {
        params: { contexto: contextoId, v: String(bust) },
        responseType: 'blob',
      })
      .subscribe({
        next: blob => {
          this.carregandoFoto = false;
          if (!blob.size) {
            this.definirFotoUrl(null);
            return;
          }
          this.definirFotoUrl(URL.createObjectURL(blob));
        },
        error: () => {
          this.carregandoFoto = false;
          this.definirFotoUrl(null);
        },
      });
  }

  enviarFoto(idPessoa: number, contextoId: string, arquivo: File): Observable<unknown> {
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    return this.http
      .put(`${environment.apiUrl}/pessoas/contexto/${idPessoa}/foto`, dados, { params: { contexto: contextoId } })
      .pipe(
        tap(() => {
          this.status.update(s => (s ? { ...s, temFoto: true } : { temFoto: true, temEmbedding: false }));
          this.carregarStatus(idPessoa, contextoId).subscribe();
        }),
      );
  }

  removerFoto(idPessoa: number, contextoId: string): Observable<unknown> {
    return this.http
      .delete(`${environment.apiUrl}/pessoas/contexto/${idPessoa}/foto`, { params: { contexto: contextoId } })
      .pipe(
        tap(() => {
          this.status.set({ temFoto: false, temEmbedding: false });
          this.definirFotoUrl(null);
        }),
      );
  }

  limpar(): void {
    this.definirFotoUrl(null);
    this.status.set(null);
  }

  private definirFotoUrl(url: string | null): void {
    if (this.fotoObjectUrl?.startsWith('blob:')) URL.revokeObjectURL(this.fotoObjectUrl);
    this.fotoObjectUrl = url;
    this.fotoUrl.set(url);
  }
}