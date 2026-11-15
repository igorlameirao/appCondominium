import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordRecoveryService } from './password-recovery.service';

@Component({
  selector: 'app-esqueci-senha',
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
                <form (ngSubmit)="enviar()">
                  <h1 class="login-title">Esqueci minha senha</h1>
                  <p class="login-subtitle">Informe o e-mail da sua conta</p>
                  <div class="form-group">
                    <label for="email">E-mail</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      [(ngModel)]="email"
                      placeholder="seu@email.com"
                      required
                      autocomplete="email"
                      [disabled]="enviando || concluido" />
                  </div>
                  @if (mensagem) {
                    <p class="login-hint" role="status">{{ mensagem }}</p>
                  }
                  @if (erro) {
                    <p class="login-hint login-hint--erro" role="alert">{{ erro }}</p>
                  }
                  <div class="actions">
                    <button class="btn-entrar" type="submit" [disabled]="enviando || concluido || !email.trim()">
                      {{ enviando ? 'Enviando...' : concluido ? 'Enviado' : 'Enviar instruções' }}
                    </button>
                  </div>
                </form>
                <p class="login-footer-link">
                  <a routerLink="/login">Voltar ao login</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EsqueciSenhaComponent {
  email = '';
  enviando = false;
  concluido = false;
  mensagem = '';
  erro = '';

  constructor(private readonly recuperacao: PasswordRecoveryService) {}

  enviar(): void {
    this.erro = '';
    this.mensagem = '';
    this.enviando = true;
    this.recuperacao.solicitar(this.email.trim()).subscribe({
      next: r => {
        this.mensagem = r.mensagem;
        this.concluido = true;
        this.enviando = false;
      },
      error: () => {
        this.erro = 'Não foi possível processar a solicitação. Tente novamente em instantes.';
        this.enviando = false;
      }
    });
  }
}