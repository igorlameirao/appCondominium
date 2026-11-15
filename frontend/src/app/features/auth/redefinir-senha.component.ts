import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PasswordRecoveryService } from './password-recovery.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
                @if (carregando) {
                  <p class="login-hint">Validando link…</p>
                } @else if (!linkValido) {
                  <h1 class="login-title">Redefinir senha</h1>
                  <p class="login-hint login-hint--erro" role="alert">{{ mensagemErro }}</p>
                  <p class="login-footer-link">
                    <a routerLink="/recuperacao-senha/esqueci">Solicitar novo link</a>
                  </p>
                } @else if (concluido) {
                  <h1 class="login-title">Senha redefinida</h1>
                  <p class="login-hint" role="status">{{ mensagemOk }}</p>
                  <p class="login-footer-link">
                    <a routerLink="/login">Ir para o login</a>
                  </p>
                } @else {
                  <form (ngSubmit)="salvar()">
                    <h1 class="login-title">Redefinir senha</h1>
                    <p class="login-subtitle">Escolha uma nova senha com pelo menos 8 caracteres</p>
                    <div class="form-group">
                      <label for="senha">Nova senha</label>
                      <input
                        id="senha"
                        name="senha"
                        type="password"
                        [(ngModel)]="senhaNova"
                        required
                        minlength="8"
                        autocomplete="new-password" />
                    </div>
                    <div class="form-group">
                      <label for="confirmar">Confirmar senha</label>
                      <input
                        id="confirmar"
                        name="confirmar"
                        type="password"
                        [(ngModel)]="senhaConfirmacao"
                        required
                        minlength="8"
                        autocomplete="new-password" />
                    </div>
                    @if (mensagemErro) {
                      <p class="login-hint login-hint--erro" role="alert">{{ mensagemErro }}</p>
                    }
                    <div class="actions">
                      <button class="btn-entrar" type="submit" [disabled]="enviando || !podeSalvar">
                        {{ enviando ? 'Salvando...' : 'Redefinir senha' }}
                      </button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RedefinirSenhaComponent implements OnInit {
  token = '';
  carregando = true;
  linkValido = false;
  concluido = false;
  enviando = false;
  senhaNova = '';
  senhaConfirmacao = '';
  mensagemErro = '';
  mensagemOk = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly recuperacao: PasswordRecoveryService
  ) {}

  get podeSalvar(): boolean {
    return (
      this.senhaNova.trim().length >= 8
      && this.senhaConfirmacao.trim().length >= 8
      && this.senhaNova === this.senhaConfirmacao
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.carregando = false;
      this.linkValido = false;
      this.mensagemErro = 'Link inválido ou expirado.';
      return;
    }
    this.recuperacao.validar(this.token).subscribe({
      next: v => {
        this.linkValido = v.valido;
        this.mensagemErro = v.valido ? '' : v.mensagem;
        this.carregando = false;
      },
      error: () => {
        this.linkValido = false;
        this.mensagemErro = 'Link inválido ou expirado.';
        this.carregando = false;
      }
    });
  }

  salvar(): void {
    this.mensagemErro = '';
    if (this.senhaNova !== this.senhaConfirmacao) {
      this.mensagemErro = 'As senhas não conferem.';
      return;
    }
    this.enviando = true;
    this.recuperacao.redefinir(this.token, this.senhaNova, this.senhaConfirmacao).subscribe({
      next: r => {
        if (r.sucesso) {
          this.mensagemOk = r.mensagem;
          this.concluido = true;
        } else {
          this.mensagemErro = r.mensagem;
        }
        this.enviando = false;
      },
      error: err => {
        this.mensagemErro =
          err?.error?.mensagem ?? 'Não foi possível redefinir a senha. O link pode ter expirado.';
        this.enviando = false;
      }
    });
  }
}