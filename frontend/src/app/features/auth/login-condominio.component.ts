import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { LoginPassosComponent } from './login-passos.component';
import { LoginSelecaoPerfilComponent } from './login-selecao-perfil.component';
import { CondominioVinculo, PerfilVinculo, destinoNoTenant, mensagemErroLogin } from './login-fluxo';
import { LoginTrilha } from './login-trilha';

/** RT-Gerais 13 — login pelo condomínio da URL. A escolha de condomínio não entra neste fluxo. */
@Component({
  selector: 'app-login-condominio',
  standalone: true,
  imports: [FormsModule, RouterLink, LoginPassosComponent, LoginSelecaoPerfilComponent],
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
                <app-login-passos
                  [deslocamento]="trilha.deslocamento"
                  [semTransicao]="trilha.semTransicao"
                  (fimTransicao)="trilha.aoFimTransicao($event)"
                  (elemento)="trilha.anexar($event)">
                  @for (passo of trilha.passos; track passo) {
                    <section
                      class="login-step"
                      [attr.aria-hidden]="passo !== trilha.atual && !trilha.animando ? true : null"
                      [attr.inert]="passo !== trilha.atual && !trilha.animando ? '' : null">
                      @switch (passo) {
                        @case ('LOGIN') {
                          <form (ngSubmit)="entrar()">
                            <h1 class="login-title">Login</h1>
                            <p class="login-subtitle">{{ subtitulo }}</p>
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
                              <button class="btn-entrar" type="submit" [disabled]="enviando || trilha.animando || !idCondominio">
                                {{ enviando && trilha.atual === 'LOGIN' ? 'Entrando...' : 'Entrar' }}
                              </button>
                            </div>
                          </form>
                          @if (!tenantHost.isTenantHost) {
                            <p class="login-footer-link">
                              <a routerLink="/login">Login administrador</a>
                            </p>
                          }
                        }
                        @case ('SELECT_PROFILE') {
                          <app-login-selecao-perfil
                            [subtitulo]="subtitulo"
                            [perfis]="perfisTenant"
                            [enviando]="enviando"
                            inputId="perfil-tenant"
                            (entrar)="confirmarPerfil($event)"
                            (voltar)="voltar()" />
                        }
                      }
                    </section>
                  }
                </app-login-passos>
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
export class LoginCondominioComponent implements OnInit, OnDestroy {
  idCondominio: number | null = null;
  usuario = '';
  senha = '';
  nomeCondominio = '';
  perfisTenant: PerfilVinculo[] = [];
  enviando = false;
  readonly trilha: LoginTrilha;

  private vinculos: CondominioVinculo[] = [];

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
    public tenantHost: TenantHostService,
    cd: ChangeDetectorRef
  ) {
    this.trilha = new LoginTrilha(() => cd.detectChanges());
  }

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
        'Condomínio não identificado. Acesse appcondominium.com.br/{identificador}/entrar ou use /entrar?idCondominio=1.'
      );
      return;
    }

    if (this.tenantDiverge()) {
      this.toast.showError('O condomínio da URL não confere com o informado.');
      this.idCondominio = null;
      return;
    }

    this.nomeCondominio = this.tenantHost.nomeCondominio;
    this.carregarNomeCondominio();
  }

  ngOnDestroy(): void {
    this.trilha.destruir();
  }

  entrar(): void {
    if (this.enviando || this.trilha.animando || !this.idCondominio) return;
    if (this.tenantDiverge()) {
      this.toast.showError('Não é permitido entrar em outro condomínio por esta URL.');
      return;
    }
    const usuario = this.usuario.trim();
    if (!usuario || !this.senha) return;
    const idCondominio = this.idCondominio;
    this.enviando = true;
    this.auth.listarVinculos(usuario, this.senha).subscribe({
      next: vinculos => {
        this.vinculos = vinculos ?? [];
        const destino = destinoNoTenant(this.vinculos, idCondominio);
        if (destino.acao !== 'autenticar') this.enviando = false;
        if (destino.acao === 'sem-acesso') {
          this.toast.showError('Usuário sem vínculo neste condomínio.');
          return;
        }
        if (destino.acao === 'autenticar') {
          this.autenticar(destino.idPerfil);
          return;
        }
        const condo = this.vinculos.find(v => v.idCondominio === idCondominio);
        this.perfisTenant = [...(condo?.perfis ?? [])];
        this.trilha.irPara('SELECT_PROFILE', ['LOGIN', 'SELECT_PROFILE']);
      },
      error: (e: unknown) => {
        this.enviando = false;
        this.toast.showError(mensagemErroLogin(e));
      }
    });
  }

  confirmarPerfil(idPerfil: number): void {
    if (this.enviando || this.trilha.animando || !this.idCondominio) return;
    if (this.tenantDiverge()) {
      this.toast.showError('Não é permitido entrar em outro condomínio por esta URL.');
      return;
    }
    this.autenticar(idPerfil);
  }

  voltar(): void {
    if (this.enviando || !this.trilha.podeVoltar()) return;
    const anterior = this.trilha.passos[this.trilha.indice - 1];
    this.trilha.irPara(anterior, this.trilha.passos);
  }

  private autenticar(idPerfil: number | null): void {
    if (!this.idCondominio) return;
    this.enviando = true;
    this.auth.login({
      usuario: this.usuario.trim(),
      senha: this.senha,
      idCondominio: this.idCondominio,
      ...(idPerfil != null ? { idPerfil } : {})
    }).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (e: unknown) => {
        this.enviando = false;
        this.toast.showError(mensagemErroLogin(e));
      }
    });
  }

  private tenantDiverge(): boolean {
    return (
      this.tenantHost.isTenantHost &&
      this.tenantHost.idCondominio != null &&
      this.idCondominio !== this.tenantHost.idCondominio
    );
  }

  private carregarNomeCondominio(): void {
    if (this.nomeCondominio || !this.idCondominio) return;
    this.http
      .get<{ nome?: string }>(`${environment.apiUrl}/lookup/condominio-resumo/${this.idCondominio}`)
      .subscribe({
        next: c => (this.nomeCondominio = c.nome ?? ''),
        error: () => {}
      });
  }
}
