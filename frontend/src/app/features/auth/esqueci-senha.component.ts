import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { PasswordRecoveryService } from './password-recovery.service';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [FormsModule, RouterLink, Icone],
  template: `
    <div class="login-screen login-screen--redefinir">
      <img
        class="login-brand-logo"
        src="/assets/login/3l7-tecnologia.png"
        alt="3L7 Tecnologia"
        width="512"
        height="512"
        decoding="async" />
      <div class="login-mobile-brand" aria-hidden="true">
        <img
          src="/assets/login/logo-appcondominium.jpg"
          alt="AppCondominium"
          width="1024"
          height="506"
          decoding="async" />
      </div>
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
                @if (concluido) {
                  <div class="login-recovery-state login-recovery-status">
                    <span
                      class="login-recovery-status__icon login-recovery-status__icon--ok login-recovery-status__icon--destaque"
                      aria-hidden="true">
                      <app-icone nome="check-circle" [tamanho]="34" />
                    </span>
                    <h1 class="login-title">Solicitação recebida!</h1>
                    <p class="login-recovery-status__texto" role="status">
                      Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
                    </p>
                    <div class="login-recovery-dica" role="note">
                      <span class="login-recovery-dica__icone" aria-hidden="true">
                        <app-icone nome="mail" [tamanho]="18" />
                      </span>
                      <span class="login-recovery-dica__texto">
                        Verifique sua caixa de entrada e também a pasta de spam.
                      </span>
                    </div>
                    <div class="actions">
                      <a class="btn-entrar" routerLink="/login">Voltar ao login</a>
                    </div>
                    <p class="login-footer-link login-footer-link--secundario">
                      <button type="button" class="login-link-action" (click)="solicitarNovamente()">
                        Não recebeu? Solicitar novamente
                      </button>
                    </p>
                  </div>
                } @else {
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
                        [disabled]="enviando" />
                    </div>
                    @if (erro) {
                      <p class="login-hint login-hint--erro" role="alert">{{ erro }}</p>
                    }
                    <div class="actions">
                      <button class="btn-entrar" type="submit" [disabled]="enviando || !email.trim()">
                        @if (enviando) {
                          <span class="login-btn-spinner" aria-hidden="true"></span>
                          Enviando...
                        } @else {
                          Enviar instruções
                        }
                      </button>
                    </div>
                  </form>
                  <p class="login-footer-link">
                    <a routerLink="/login">Voltar ao login</a>
                  </p>
                }
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
  erro = '';

  constructor(private readonly recuperacao: PasswordRecoveryService) {}

  enviar(): void {
    if (this.enviando) {
      return;
    }
    const destino = this.email.trim();
    if (!destino) {
      return;
    }
    this.erro = '';
    this.enviando = true;
    this.recuperacao.solicitar(destino).subscribe({
      next: () => {
        this.concluido = true;
        this.enviando = false;
      },
      error: () => {
        this.erro = 'Não foi possível processar a solicitação. Tente novamente em instantes.';
        this.enviando = false;
      }
    });
  }

  solicitarNovamente(): void {
    this.concluido = false;
    this.erro = '';
  }
}