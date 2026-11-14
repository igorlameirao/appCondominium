import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { isReservedTenantSlug } from '../../core/tenancy/tenant-route.constants';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { LoginPassosComponent } from './login-passos.component';
import { LoginSelecaoPerfilComponent } from './login-selecao-perfil.component';
import {
  CondominioVinculo,
  DestinoLogin,
  PerfilVinculo,
  destinoAposCondominio,
  destinoAposCredenciais,
  mensagemErroLogin
} from './login-fluxo';
import { LoginTrilha } from './login-trilha';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ComboboxCustomizadaComponent, LoginPassosComponent, LoginSelecaoPerfilComponent],
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
                            <p class="login-subtitle">Administração de Condomínios</p>
                            <div class="form-group">
                              <label for="usuario">Usuário (e-mail)</label>
                              <input id="usuario" name="usuario" type="text" [(ngModel)]="usuario" placeholder="E-mail" required autocomplete="username" />
                            </div>
                            <div class="form-group">
                              <label for="senha">Senha</label>
                              <input id="senha" name="senha" type="password" [(ngModel)]="senha" placeholder="••••••••" required autocomplete="current-password" />
                            </div>
                            <div class="actions">
                              <button class="btn-entrar" type="submit" [disabled]="enviando || trilha.animando">{{ enviando && trilha.atual === 'LOGIN' ? 'Entrando...' : 'Entrar' }}</button>
                            </div>
                          </form>
                        }
                        @case ('SELECT_CONDO') {
                          <form (ngSubmit)="confirmarCondominio()">
                            <button class="login-voltar" type="button" (click)="voltar()" [disabled]="enviando">Voltar</button>
                            <h1 class="login-title">Condomínio</h1>
                            <p class="login-subtitle">Selecione o condomínio</p>
                            <div class="form-group">
                              <label for="condominio">Condomínio</label>
                              <app-combobox-customizada
                                inputId="condominio"
                                [options]="condominioOptions"
                                [(value)]="idCondominio"
                                placeholder="Selecione o condomínio"
                                [required]="true" />
                            </div>
                            <div class="actions">
                              <button class="btn-entrar" type="submit" [disabled]="enviando || idCondominio == null">{{ enviando ? 'Entrando...' : rotuloPassoCondominio }}</button>
                            </div>
                          </form>
                        }
                        @case ('SELECT_PROFILE') {
                          <app-login-selecao-perfil
                            [subtitulo]="nomeCondominioSelecionado"
                            [perfis]="perfisAtuais"
                            [enviando]="enviando"
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
                  <img class="login-panel-logo" src="/assets/login/logo-appcondominium.jpg" alt="AppCondominium" width="1024" height="506" decoding="async" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  usuario = '';
  senha = '';
  idCondominio: number | null = null;
  condominioOptions: ComboboxOption[] = [];
  perfisAtuais: PerfilVinculo[] = [];
  enviando = false;
  readonly trilha: LoginTrilha;

  private vinculos: CondominioVinculo[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private tenantHost: TenantHostService,
    private condominioCtx: CondominioContextService,
    cd: ChangeDetectorRef
  ) {
    this.trilha = new LoginTrilha(() => cd.detectChanges());
  }

  get rotuloPassoCondominio(): string {
    const condo = this.vinculos.find(v => v.idCondominio === this.idCondominio);
    return condo && condo.perfis.length > 1 ? 'Continuar' : 'Entrar';
  }

  get nomeCondominioSelecionado(): string {
    return this.vinculos.find(v => v.idCondominio === this.idCondominio)?.nome ?? 'Selecione o perfil';
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      const id = this.condominioCtx.idCondominio;
      if (id) void this.abrirNoTenant(id);
      else void this.router.navigate(['/inicio']);
      return;
    }
    if (this.tenantHost.isTenantHost) {
      void this.router.navigate(['/entrar'], { replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.trilha.destruir();
  }

  entrar(): void {
    if (this.enviando || this.trilha.animando) return;
    const usuario = this.usuario.trim();
    if (!usuario || !this.senha) return;
    this.enviando = true;
    this.auth.listarVinculos(usuario, this.senha).subscribe({
      next: vinculos => {
        this.vinculos = vinculos ?? [];
        const destino = destinoAposCredenciais(this.vinculos);
        if (destino.acao !== 'autenticar') this.enviando = false;
        this.aplicarDestino(destino, false);
      },
      error: (e: unknown) => {
        this.enviando = false;
        this.toast.showError(mensagemErroLogin(e));
      }
    });
  }

  confirmarCondominio(): void {
    if (this.enviando || this.trilha.animando || this.idCondominio == null) return;
    const condo = this.vinculos.find(v => v.idCondominio === this.idCondominio);
    if (!condo) return;
    const destino = destinoAposCondominio(condo);
    if (destino.acao === 'autenticar') this.enviando = true;
    this.aplicarDestino(destino, true);
  }

  confirmarPerfil(idPerfil: number): void {
    if (this.enviando || this.trilha.animando || this.idCondominio == null) return;
    this.autenticar(this.idCondominio, idPerfil);
  }

  voltar(): void {
    if (this.enviando || !this.trilha.podeVoltar()) return;
    const anterior = this.trilha.passos[this.trilha.indice - 1];
    if (anterior === 'LOGIN') this.idCondominio = null;
    this.trilha.irPara(anterior, this.trilha.passos);
  }

  private aplicarDestino(destino: DestinoLogin, veioDoCondominio: boolean): void {
    switch (destino.acao) {
      case 'sem-vinculo':
        this.toast.showError('Usuário sem vínculo em condomínio.');
        return;
      case 'autenticar':
        this.autenticar(destino.idCondominio, destino.idPerfil);
        return;
      case 'selecionar-condominio':
        this.idCondominio = null;
        this.condominioOptions = this.vinculos.map(v => ({ value: v.idCondominio, label: v.nome }));
        this.trilha.irPara('SELECT_CONDO', ['LOGIN', 'SELECT_CONDO']);
        return;
      case 'selecionar-perfil':
        this.prepararPerfis(destino.idCondominio);
        this.trilha.irPara(
          'SELECT_PROFILE',
          veioDoCondominio ? ['LOGIN', 'SELECT_CONDO', 'SELECT_PROFILE'] : ['LOGIN', 'SELECT_PROFILE']
        );
        return;
    }
  }

  private prepararPerfis(idCondominio: number): void {
    this.idCondominio = idCondominio;
    const condo = this.vinculos.find(v => v.idCondominio === idCondominio);
    this.perfisAtuais = [...(condo?.perfis ?? [])];
  }

  private autenticar(idCondominio: number, idPerfil: number | null): void {
    this.enviando = true;
    this.auth.login({
      usuario: this.usuario.trim(),
      senha: this.senha,
      idCondominio,
      ...(idPerfil != null ? { idPerfil } : {})
    }).subscribe({
      next: () => void this.abrirNoTenant(idCondominio),
      error: (e: unknown) => {
        this.enviando = false;
        this.toast.showError(mensagemErroLogin(e));
      }
    });
  }

  /** Entra em /{identificador}/inicio para o tenant da sessão ficar resolvido na URL. */
  private async abrirNoTenant(idCondominio: number): Promise<void> {
    try {
      const condo = this.vinculos.find(v => v.idCondominio === idCondominio);
      let slug = condo?.dominio?.trim().toLowerCase() || null;
      if (!slug || isReservedTenantSlug(slug)) {
        slug = await this.tenantHost.slugForCondominio(idCondominio);
      }
      if (slug && !isReservedTenantSlug(slug)) {
        await this.tenantHost.resolveBySlug(slug);
      }
      const abriu = await this.router.navigate(['/inicio']);
      if (!abriu) this.enviando = false;
    } catch {
      this.enviando = false;
      this.toast.showError('Não foi possível identificar o condomínio.');
    }
  }
}
