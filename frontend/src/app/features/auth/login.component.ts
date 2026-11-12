import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboboxCustomizadaComponent],
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
                <p class="login-subtitle">Administração de Condomínios</p>
                <form (ngSubmit)="entrar()">
                  <div class="form-group">
                    <label for="usuario">Usuário (e-mail)</label>
                    <input id="usuario" name="usuario" type="text" [(ngModel)]="usuario" (input)="onUsuarioAlterado()" placeholder="E-mail" required autocomplete="username" />
                  </div>
                  <div class="form-group">
                    <label for="senha">Senha</label>
                    <input id="senha" name="senha" type="password" [(ngModel)]="senha" placeholder="••••••••" required autocomplete="current-password" />
                  </div>
                  <div class="form-group">
                    <label for="condominio">Condomínio</label>
                    <app-combobox-customizada
                      inputId="condominio"
                      [options]="condominioOptions"
                      [(value)]="idCondominio"
                      placeholder="Digite 3+ letras do nome"
                      [required]="true"
                      [remoteSearch]="true"
                      [minSearchLength]="3"
                      minLengthMessage="Digite ao menos 3 letras."
                      (searchChange)="onCondominioBusca($event)" />
                    <p class="login-hint" *ngIf="condominioBusca.trim().length > 0 && condominioBusca.trim().length < 3">Digite ao menos 3 letras.</p>
                  </div>
                  <div class="actions">
                    <button class="btn-entrar" type="submit" [disabled]="!idCondominio">Entrar</button>
                  </div>
                </form>
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
export class LoginComponent implements OnInit {
  usuario = '';
  senha = '';
  idCondominio: number | null = null;
  condominioBusca = '';
  condominioOptions: ComboboxOption[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private tenantHost: TenantHostService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      void this.router.navigate(['/']);
      return;
    }
    if (this.tenantHost.isTenantHost) {
      void this.router.navigate(['/entrar'], { replaceUrl: true });
    }
  }

  onCondominioBusca(termo: string): void {
    this.condominioBusca = termo;
    this.buscarCondominios();
  }

  onUsuarioAlterado(): void {
    this.idCondominio = null;
    this.buscarCondominios();
  }

  buscarCondominios(): void {
    if (!this.usuario.trim() || this.condominioBusca.trim().length < 3) {
      this.condominioOptions = [];
      return;
    }
    this.auth.listCondominios(this.condominioBusca.trim(), this.usuario.trim()).subscribe({
      next: r => (this.condominioOptions = r.map(c => ({ value: c.idCondominio, label: c.nome }))),
      error: () => (this.condominioOptions = [])
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
