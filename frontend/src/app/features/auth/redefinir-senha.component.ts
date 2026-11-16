import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { PasswordRecoveryService } from './password-recovery.service';

@Component({
  selector: 'app-redefinir-senha',
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
                @if (carregando) {
                  <div class="login-recovery-state login-recovery-loading" role="status">
                    Validando link…
                  </div>
                } @else if (concluido) {
                  <div class="login-recovery-state login-recovery-status">
                    <span class="login-recovery-status__icon login-recovery-status__icon--ok login-recovery-status__icon--destaque">
                      <app-icone nome="check-circle" [tamanho]="34" />
                    </span>
                    <h1 class="login-title">Senha redefinida</h1>
                    <p class="login-recovery-status__texto" role="status">{{ mensagemOk }}</p>
                    <div class="actions">
                      <a class="btn-entrar" routerLink="/login">Ir para o login</a>
                    </div>
                  </div>
                } @else if (!linkValido) {
                  <div class="login-recovery-state">
                    @if (!exibirSolicitarLink) {
                      <div class="login-recovery-status">
                        <span class="login-recovery-status__icon login-recovery-status__icon--erro">
                          <app-icone nome="alert" [tamanho]="28" />
                        </span>
                        <h1 class="login-title">
                          {{ falhaRede ? 'Falha na validação' : 'Link expirado ou inválido' }}
                        </h1>
                        <p class="login-recovery-status__texto" role="alert">
                          {{ mensagemLinkInvalido }}
                        </p>
                        <div class="actions">
                          @if (falhaRede) {
                            <button class="btn-entrar" type="button" (click)="revalidar()" [disabled]="carregando">
                              Tentar novamente
                            </button>
                          } @else {
                            <button class="btn-entrar" type="button" (click)="abrirSolicitarLink()">
                              Solicitar novo link
                            </button>
                          }
                        </div>
                        <p class="login-footer-link login-footer-link--secundario">
                          <a routerLink="/login">Voltar ao login</a>
                        </p>
                      </div>
                    } @else {
                      <form (ngSubmit)="solicitarNovoLink()">
                        <h1 class="login-title">Novo link</h1>
                        <p class="login-subtitle">Informe o e-mail da sua conta</p>
                        <div class="form-group">
                          <label for="email-recuperacao">E-mail</label>
                          <input
                            id="email-recuperacao"
                            name="email"
                            type="email"
                            [(ngModel)]="emailRecuperacao"
                            placeholder="seu@email.com"
                            required
                            autocomplete="email"
                            [disabled]="enviandoSolicitacao || solicitacaoConcluida" />
                        </div>
                        @if (mensagemSolicitacao) {
                          <p class="login-hint" role="status">{{ mensagemSolicitacao }}</p>
                        }
                        @if (mensagemErro) {
                          <p class="login-hint login-hint--erro" role="alert">{{ mensagemErro }}</p>
                        }
                        <div class="actions">
                          <button
                            class="btn-entrar"
                            type="submit"
                            [disabled]="enviandoSolicitacao || solicitacaoConcluida || !emailRecuperacao.trim()">
                            @if (enviandoSolicitacao) {
                              <span class="login-btn-spinner" aria-hidden="true"></span>
                              Enviando...
                            } @else {
                              Enviar instruções
                            }
                          </button>
                        </div>
                        <p class="login-footer-link login-footer-link--secundario">
                          <a routerLink="/login">Voltar ao login</a>
                        </p>
                      </form>
                    }
                  </div>
                } @else {
                  <div class="login-recovery-state">
                    <form (ngSubmit)="salvar()">
                      <h1 class="login-title">Redefinir senha</h1>
                      <p class="login-subtitle">Escolha uma nova senha com pelo menos 8 caracteres</p>
                      <div class="form-group">
                        <label for="senha">Nova senha</label>
                        <div class="login-senha-wrap">
                          <input
                            id="senha"
                            name="senha"
                            [type]="mostrarSenhaNova ? 'text' : 'password'"
                            [(ngModel)]="senhaNova"
                            required
                            minlength="8"
                            autocomplete="new-password"
                            [disabled]="enviando" />
                          <button
                            class="login-senha-toggle"
                            type="button"
                            (click)="mostrarSenhaNova = !mostrarSenhaNova"
                            [attr.aria-label]="mostrarSenhaNova ? 'Ocultar senha' : 'Mostrar senha'"
                            [attr.aria-pressed]="mostrarSenhaNova">
                            <app-icone [nome]="mostrarSenhaNova ? 'eye-off' : 'eye'" [tamanho]="18" />
                          </button>
                        </div>
                      </div>
                      <div class="form-group">
                        <label for="confirmar">Confirmar senha</label>
                        <div class="login-senha-wrap">
                          <input
                            id="confirmar"
                            name="confirmar"
                            [type]="mostrarSenhaConfirmacao ? 'text' : 'password'"
                            [(ngModel)]="senhaConfirmacao"
                            required
                            minlength="8"
                            autocomplete="new-password"
                            [disabled]="enviando" />
                          <button
                            class="login-senha-toggle"
                            type="button"
                            (click)="mostrarSenhaConfirmacao = !mostrarSenhaConfirmacao"
                            [attr.aria-label]="mostrarSenhaConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'"
                            [attr.aria-pressed]="mostrarSenhaConfirmacao">
                            <app-icone [nome]="mostrarSenhaConfirmacao ? 'eye-off' : 'eye'" [tamanho]="18" />
                          </button>
                        </div>
                      </div>
                      @if (mensagemErro) {
                        <p class="login-hint login-hint--erro" role="alert">{{ mensagemErro }}</p>
                      }
                      <div class="actions">
                        <button class="btn-entrar" type="submit" [disabled]="enviando || !podeSalvar">
                          @if (enviando) {
                            <span class="login-btn-spinner" aria-hidden="true"></span>
                            Salvando...
                          } @else {
                            Redefinir senha
                          }
                        </button>
                      </div>
                      <p class="login-footer-link login-footer-link--secundario">
                        <a routerLink="/login">Voltar ao login</a>
                      </p>
                    </form>
                  </div>
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
  falhaRede = false;
  senhaNova = '';
  senhaConfirmacao = '';
  mensagemErro = '';
  mensagemOk = '';
  mensagemLinkInvalido =
    'Este link não está mais disponível. Solicite um novo e-mail de recuperação.';
  mostrarSenhaNova = false;
  mostrarSenhaConfirmacao = false;

  exibirSolicitarLink = false;
  emailRecuperacao = '';
  enviandoSolicitacao = false;
  solicitacaoConcluida = false;
  mensagemSolicitacao = '';

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
    this.token = this.lerTokenDaUrl();
    this.validarLink();
  }

  revalidar(): void {
    if (!this.token) {
      this.mensagemLinkInvalido = 'Link inválido ou incompleto.';
      this.linkValido = false;
      this.falhaRede = false;
      return;
    }
    this.validarLink();
  }

  abrirSolicitarLink(): void {
    this.exibirSolicitarLink = true;
    this.mensagemErro = '';
    this.mensagemSolicitacao = '';
  }

  solicitarNovoLink(): void {
    if (this.enviandoSolicitacao) return;
    const email = this.emailRecuperacao.trim();
    if (!email) return;
    this.mensagemErro = '';
    this.mensagemSolicitacao = '';
    this.enviandoSolicitacao = true;
    this.recuperacao.solicitar(email).subscribe({
      next: () => {
        this.mensagemSolicitacao =
          'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
        this.solicitacaoConcluida = true;
        this.enviandoSolicitacao = false;
      },
      error: err => {
        this.mensagemErro = this.mensagemErroApi(
          err,
          'Não foi possível processar a solicitação. Tente novamente em instantes.'
        );
        this.enviandoSolicitacao = false;
      }
    });
  }

  salvar(): void {
    if (this.enviando) return;
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
          this.tratarFalhaRedefinir(r.mensagem);
        }
        this.enviando = false;
      },
      error: err => {
        const status = (err as { status?: number })?.status ?? 0;
        const msg = this.mensagemErroApi(err, '');
        if (status >= 500 || status === 0) {
          this.mensagemErro =
            msg || 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';
        } else if (this.ehErroDeLink(msg)) {
          this.tratarFalhaRedefinir(msg);
        } else {
          this.mensagemErro = msg || 'Não foi possível redefinir a senha.';
        }
        this.enviando = false;
      }
    });
  }

  private validarLink(): void {
    this.carregando = true;
    this.falhaRede = false;
    this.exibirSolicitarLink = false;
    if (!this.token) {
      this.carregando = false;
      this.linkValido = false;
      this.mensagemLinkInvalido = 'Link inválido ou incompleto.';
      return;
    }
    this.recuperacao.validar(this.token).subscribe({
      next: v => {
        this.linkValido = v.valido;
        if (!v.valido) {
          this.mensagemLinkInvalido = v.mensagem || this.mensagemLinkInvalido;
        }
        this.carregando = false;
      },
      error: err => {
        this.linkValido = false;
        this.falhaRede = true;
        this.mensagemLinkInvalido = this.mensagemErroApi(
          err,
          'Não foi possível validar o link agora. Verifique sua conexão e tente novamente.'
        );
        this.carregando = false;
      }
    });
  }

  private tratarFalhaRedefinir(mensagem: string): void {
    if (this.ehErroDeLink(mensagem)) {
      this.linkValido = false;
      this.mensagemLinkInvalido = mensagem;
      this.falhaRede = false;
      return;
    }
    this.mensagemErro = mensagem;
  }

  private ehErroDeLink(mensagem: string): boolean {
    const m = mensagem.toLowerCase();
    return m.includes('link') || m.includes('expirad') || m.includes('utilizado');
  }

  private lerTokenDaUrl(): string {
    const bruto = this.route.snapshot.queryParamMap.get('token') ?? '';
    return bruto.trim();
  }

  private mensagemErroApi(err: unknown, fallback: string): string {
    const body = (err as { error?: { mensagem?: string; message?: string } })?.error;
    const msg = body?.mensagem?.trim() || body?.message?.trim() || '';
    return msg || fallback;
  }
}