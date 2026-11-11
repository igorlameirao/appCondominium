import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PerfilConta {
  nome: string;
  perfil: string;
  temFoto: boolean;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContaService {
  readonly perfil = signal<PerfilConta | null>(null);
  readonly fotoUrl = signal<string | null>(null);

  private fotoObjectUrl: string | null = null;
  private carregandoFoto = false;

  constructor(private http: HttpClient) {}

  carregarPerfil(): Observable<PerfilConta> {
    return this.http.get<PerfilConta>(`${environment.apiUrl}/conta/perfil`).pipe(
      tap(p => {
        this.perfil.set(p);
        if (p.temFoto) this.carregarFoto();
        else this.definirFotoUrl(null);
      }),
    );
  }

  carregarFoto(): void {
    if (this.carregandoFoto) return;
    this.carregandoFoto = true;
    const bust = Date.now();
    this.http.get(`${environment.apiUrl}/conta/foto?v=${bust}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        this.carregandoFoto = false;
        if (!blob.size) {
          this.definirFotoUrl(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        this.definirFotoUrl(url);
      },
      error: () => {
        this.carregandoFoto = false;
        this.definirFotoUrl(null);
      },
    });
  }

  enviarFoto(arquivo: File): Observable<unknown> {
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    return this.http.put(`${environment.apiUrl}/conta/foto`, dados).pipe(
      tap(() => {
        this.perfil.update(p => (p ? { ...p, temFoto: true } : p));
        this.carregarFoto();
      }),
    );
  }

  removerFoto(): Observable<unknown> {
    return this.http.delete(`${environment.apiUrl}/conta/foto`).pipe(
      tap(() => {
        this.perfil.update(p => (p ? { ...p, temFoto: false } : p));
        this.definirFotoUrl(null);
      }),
    );
  }

  alterarSenha(senhaAtual: string, senhaNova: string): Observable<unknown> {
    return this.http.put(`${environment.apiUrl}/conta/senha`, { senhaAtual, senhaNova });
  }

  sincronizarComSessao(): void {
    const nome = sessionStorage.getItem('nome') ?? 'Usuário';
    const perfil = sessionStorage.getItem('perfil') ?? '';
    const atual = this.perfil();
    if (!atual) {
      this.perfil.set({ nome, perfil, temFoto: false });
    }
  }

  limpar(): void {
    this.definirFotoUrl(null);
    this.perfil.set(null);
  }

  private definirFotoUrl(url: string | null): void {
    if (this.fotoObjectUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.fotoObjectUrl);
    }
    this.fotoObjectUrl = url;
    this.fotoUrl.set(url);
  }
}
