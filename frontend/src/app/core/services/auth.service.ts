import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CondominioContextService } from './condominio-context.service';
import { PermissionService } from './permission.service';
import { TenantHostService } from './tenant-host.service';

export interface LoginRequest {
  usuario: string;
  senha: string;
  idCondominio: number;
}

export interface LoginResponse {
  token: string;
  idCondominio: number;
  perfil: string;
  nome: string;
  acessoTotal: boolean;
  permissoes: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private condominioContext: CondominioContextService,
    private permissions: PermissionService,
    private tenantHost: TenantHostService
  ) {}

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.condominioContext.idCondominio;
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => {
        sessionStorage.setItem(this.tokenKey, res.token);
        this.condominioContext.setCondominio(res.idCondominio);
        sessionStorage.setItem('perfil', res.perfil);
        sessionStorage.setItem('nome', res.nome);
        this.permissions.apply(res.acessoTotal, res.permissoes);
      })
    );
  }

  listCondominios(q?: string, usuario?: string): Observable<{ idCondominio: number; nome: string }[]> {
    let params = new HttpParams();
    if (q && q.length >= 3) params = params.set('q', q);
    if (usuario) params = params.set('usuario', usuario);
    return this.http.get<{ idCondominio: number; nome: string }[]>(
      `${environment.apiUrl}/auth/condominios`,
      { params }
    );
  }

  trocarCondominio(idCondominio: number): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/trocar-condominio`, { idCondominio }).pipe(
      tap(res => {
        sessionStorage.setItem(this.tokenKey, res.token);
        this.condominioContext.setCondominio(res.idCondominio);
        sessionStorage.setItem('perfil', res.perfil);
        sessionStorage.setItem('nome', res.nome);
        this.permissions.apply(res.acessoTotal, res.permissoes);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem('perfil');
    sessionStorage.removeItem('nome');
    this.permissions.clear();
    this.condominioContext.clear();
    void this.router.navigate([this.tenantHost.loginPath]);
  }
}
