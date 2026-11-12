import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../../core/services/tenant-host.service';

/** RT-Gerais 13 — login por domínio do condomínio (layout padrão, sem escolha de tenant). */
@Component({
  selector: 'app-login-condominio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <img
        class="login-brand-logo"
        src="/assets/login/3l7-tecnologia.png"
        alt="3L7 Tecnologia"
        width="512"
        height="512"
        decoding="async" />
      <div class="login-layout">
        <aside class="login-art" aria-hidden="true">
          <img
            class="login-art-img"
            src="/assets/login/condominio-login.jpg"
            alt=""
            width="1024"
            height="1024"
            decoding="async"
            fetchpriority="high" />
        </aside>
        <div class="login-main">
          <div class="login-container">
            <div class="login-card">
              <div class="login-card-form">
                <h1 class="login-title">Login</h1>
                <p class="login-subtitle">{{ subtitulo }}</p>
                <form (ngSubmit)="entrar()">
                  <div class="form-group">
                    <label for="usuario">Usuário (e-mail)</label>
                    <input
                      id="usuario"
                      name="usuario"
                      type="text"
                      [(ngModel)]="usuario"
                      placeholder="E-mail"
                      required
                      autocomplete="username" />
                  </div>
                  <div class="form-group">
                    <label for="senha">Senha</label>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      [(ngModel)]="senha"
                      placeholder="••••••••"
                      required
                      autocomplete="current-password" />
                  </div>
                  <div class="actions">
                    <button class="btn-entrar" type="submit" [disabled]="!idCondominio">Entrar</button>
                  </div>
                </form>
                <p class="login-footer-link" *ngIf="!tenantHost.isTenantHost">
                  <a href="/login">Login administrador</a>
                </p>
              </div>
              <div class="login-card-panel">
                <div class="login-panel-logo-frame">
                  <img
                    class="login-panel-logo"
                    src="/assets/login/logo-appcondominium.jpg"
                    alt="AppCondominium"
                    width="1024"
                    height="506"
                    decoding="async" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginCondominioComponent implements OnInit {
  idCondominio: number | null = null;
  usuario = '';
  senha = '';
  nomeCondominio = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
    public tenantHost: TenantHostService
  ) {}

  get subtitulo(): string {
    const nome = this.nomeCondominio || this.tenantHost.nomeCondominio;
    return nome ? nome : 'Acesso ao condomínio';
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      void this.router.navigate(['/']);
      return;
    }
    const q = this.route.snapshot.queryParamMap.get('idCondominio');
    if (q) this.idCondominio = Number(q);
    else if (this.tenantHost.idCondominio) this.idCondominio = this.tenantHost.idCondominio;

    if (!this.idCondominio) {
      this.toast.showError(
        'Condomínio não identificado. Acesse pelo domínio cadastrado ou use /entrar?idCondominio=1.'
      );
      return;
    }

    this.nomeCondominio = this.tenantHost.nomeCondominio;
    this.carregarNomeCondominio();
  }

  private carregarNomeCondominio(): void {
    if (this.nomeCondominio) return;
    this.http
      .get<{ nome?: string }>(`${environment.apiUrl}/lookup/condominio-resumo/${this.idCondominio}`)
      .subscribe({
        next: c => (this.nomeCondominio = c.nome ?? ''),
        error: () => {}
      });
  }

  entrar(): void {
    if (!this.idCondominio) return;
    this.auth.login({ usuario: this.usuario, senha: this.senha, idCondominio: this.idCondominio }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e: unknown) => this.avisarFalha(e)
    });
  }

  private avisarFalha(e: unknown): void {
    const err = e as { status?: number; error?: { title?: string; message?: string } | string; message?: string };
    if (err?.status === 0) {
      this.toast.showError('Não foi possível conectar ao servidor. Verifique a rede e se a API está no ar.');
      return;
    }
    const body = err?.error;
    const msg = typeof body === 'string' ? body : body?.title ?? body?.message;
    this.toast.showError(msg || 'E-mail ou senha inválidos. Tente novamente.');
  }
}
