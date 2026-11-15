import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ToastService } from '../../core/services/toast.service';
import { ConfiguracaoEmailService } from './configuracao-email.service';
import { AnexarAoBodyDirective } from '../../shared/foto-perfil/anexar-ao-body.directive';

@Component({
  selector: 'app-configuracao-email',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, Icone, AnexarAoBodyDirective],
  host: { class: 'form-page form-page--wide' },
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Configuração SMTP</span>
          </nav>
          <h1 class="cad-titulo">Configuração SMTP</h1>
          <p class="cad-subtitulo">Provedor de e-mail global do sistema (convites e notificações)</p>
        </header>

        <section class="cad-card form-page">
          <form [formGroup]="form" (ngSubmit)="salvar()" id="smtpForm" novalidate>
            <div class="form-scroll cad-form-scroll">
              <div class="form-grid smtp-dados">
                <div class="form-group smtp-dados__provedor">
                  <label for="provedor">Provedor</label>
                  <select id="provedor" formControlName="provedor">
                    <option value="SmtpGenerico">SMTP Genérico</option>
                    <option value="AmazonSesSmtp">Amazon SES SMTP</option>
                  </select>
                </div>
                <div class="form-group smtp-dados__servidor">
                  <label for="servidorSmtp">Servidor SMTP *</label>
                  <input id="servidorSmtp" formControlName="servidorSmtp" required maxlength="255" autocomplete="off" />
                </div>
                <div class="form-group smtp-dados__porta">
                  <label for="porta">Porta *</label>
                  <input id="porta" type="number" formControlName="porta" required min="1" max="65535" />
                </div>
                <div class="form-group smtp-dados__situacao">
                  <label id="smtpSituacaoLabel">Situação</label>
                  <div
                    class="cad-segmento-situacao"
                    role="group"
                    aria-labelledby="smtpSituacaoLabel">
                    <button
                      type="button"
                      class="cad-segmento-situacao__opcao"
                      [class.cad-segmento-situacao__opcao--ativa]="form.controls.ativo.value"
                      [attr.aria-pressed]="form.controls.ativo.value"
                      (click)="definirAtivo(true)">
                      Ativo
                    </button>
                    <button
                      type="button"
                      class="cad-segmento-situacao__opcao"
                      [class.cad-segmento-situacao__opcao--ativa]="!form.controls.ativo.value"
                      [attr.aria-pressed]="!form.controls.ativo.value"
                      (click)="definirAtivo(false)">
                      Inativo
                    </button>
                  </div>
                </div>
                <div class="form-group smtp-dados__usuario">
                  <label for="usuarioSmtp">Usuário SMTP *</label>
                  <input id="usuarioSmtp" formControlName="usuarioSmtp" required autocomplete="username" />
                </div>
                <div class="form-group smtp-dados__senha">
                  <label for="senha">Senha {{ senhaObrigatoria ? '*' : '(em branco = manter)' }}</label>
                  <input id="senha" type="password" formControlName="senha" autocomplete="new-password"
                    [placeholder]="senhaConfigurada ? '••••••••' : ''" />
                  @if (senhaRequerAtualizacao) {
                    <p class="cad-aviso smtp-senha-aviso">A senha salva não pôde ser lida. Informe-a novamente e salve.</p>
                  }
                </div>
                <div class="form-group smtp-dados__nome-rem">
                  <label for="nomeRemetente">Nome do remetente *</label>
                  <input id="nomeRemetente" formControlName="nomeRemetente" required maxlength="200" />
                </div>
                <div class="form-group smtp-dados__email-rem">
                  <label for="emailRemetente">E-mail do remetente *</label>
                  <input id="emailRemetente" type="email" formControlName="emailRemetente" required maxlength="255" />
                </div>
              </div>

              <section class="cad-grupo smtp-seguranca" aria-labelledby="smtpSegurancaTitulo">
                <h2 class="smtp-seguranca__titulo" id="smtpSegurancaTitulo">Segurança da conexão</h2>
                <div class="smtp-seguranca__corpo">
                  <div class="smtp-seguranca__opcoes">
                    <div class="cad-switch-linha">
                      <label class="cad-switch">
                        <input type="checkbox" formControlName="ssl" aria-label="SSL/TLS" />
                        <span class="cad-switch-trilha" aria-hidden="true"></span>
                      </label>
                      <span class="cad-switch-estado">SSL/TLS</span>
                    </div>
                    <div class="cad-switch-linha">
                      <label class="cad-switch">
                        <input type="checkbox" formControlName="startTls" aria-label="STARTTLS" />
                        <span class="cad-switch-trilha" aria-hidden="true"></span>
                      </label>
                      <span class="cad-switch-estado">STARTTLS</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="smtpForm" [disabled]="saving">Salvar</button>
            <button type="button" class="btn-secondary" (click)="testarConexao()" [disabled]="saving || testing">Testar conexão</button>
            <button type="button" class="btn-secondary" (click)="abrirTesteEnvio()" [disabled]="saving || testing">Enviar teste</button>
            <span class="cad-acoes__espaco"></span>
            <button type="button" class="btn-cancelar" routerLink="/inicio">Voltar</button>
          </div>
        </section>
      </div>
    </div>

    @if (modalTeste) {
      <div
        class="confirm-overlay"
        appAnexarAoBody
        role="presentation"
        (click)="fecharModalTeste()"
        (keydown.escape)="fecharModalTeste()">
        <div
          class="confirm-modal modal-sge-form"
          role="dialog"
          aria-modal="true"
          aria-labelledby="smtp-teste-titulo"
          (click)="$event.stopPropagation()">
          <header class="captura-modal__topo">
            <h3 id="smtp-teste-titulo">E-mail de teste</h3>
            <button
              type="button"
              class="btn-ghost btn-icon btn-icon--sm"
              aria-label="Fechar"
              [disabled]="testing"
              (click)="fecharModalTeste()">
              <app-icone nome="x" [tamanho]="16" />
            </button>
          </header>
          <div class="captura-modal__corpo modal-sge-form__corpo">
            <div class="form-group">
              <label for="destTeste">E-mail do destinatário *</label>
              <input
                id="destTeste"
                name="destTeste"
                type="email"
                required
                [(ngModel)]="destinoTeste"
                placeholder="exemplo@dominio.com.br"
                autocomplete="email"
                [disabled]="testing"
                (blur)="destTesteTocado = true"
                [class.modal-sge-form__campo--vazio]="destTesteTocado && !destinoTeste.trim()"
                [class.modal-sge-form__campo--invalido]="destTesteTocado && !!destinoTeste.trim() && !emailDestinoValido()" />
              @if (destTesteTocado && destinoTeste.trim() && !emailDestinoValido()) {
                <p class="field-error">Informe um e-mail válido.</p>
              }
            </div>
            <div class="captura-acoes modal-sge-form__rodape">
              <button type="button" class="btn-cancelar-modal" [disabled]="testing" (click)="fecharModalTeste()">Cancelar</button>
              <button
                type="button"
                class="btn-gravar"
                [class.is-loading]="testing"
                [attr.aria-busy]="testing || null"
                [disabled]="testing"
                (click)="enviarTeste()">
                <app-icone nome="mail" [tamanho]="14" />
                {{ testing ? 'Enviando...' : 'Enviar teste' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .smtp-senha-aviso { margin-top: 8px; }
  `]
})
export class ConfiguracaoEmailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ConfiguracaoEmailService);
  private readonly toast = inject(ToastService);

  form = this.fb.nonNullable.group({
    provedor: ['SmtpGenerico', Validators.required],
    servidorSmtp: ['', Validators.required],
    porta: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
    ssl: [true],
    startTls: [false],
    timeoutSegundos: [30],
    usuarioSmtp: ['', Validators.required],
    senha: [''],
    nomeRemetente: ['AppCondominium', Validators.required],
    emailRemetente: ['', Validators.required],
    replyTo: [''],
    ativo: [true]
  });

  saving = false;
  testing = false;
  senhaConfigurada = false;
  senhaRequerAtualizacao = false;
  modalTeste = false;
  destinoTeste = '';
  destTesteTocado = false;

  get senhaObrigatoria(): boolean {
    return !this.senhaConfigurada || this.senhaRequerAtualizacao;
  }

  definirAtivo(ativo: boolean): void {
    this.form.patchValue({ ativo });
  }

  ngOnInit(): void {
    this.api.obter().subscribe({
      next: cfg => {
        this.senhaConfigurada = !!cfg.senhaConfigurada;
        this.senhaRequerAtualizacao = !!cfg.senhaRequerAtualizacao;
        this.form.patchValue({
          provedor: cfg.provedor || 'SmtpGenerico',
          servidorSmtp: cfg.servidorSmtp || '',
          porta: cfg.porta || 587,
          ssl: cfg.ssl ?? true,
          startTls: cfg.startTls ?? false,
          timeoutSegundos: cfg.timeoutSegundos || 30,
          usuarioSmtp: cfg.usuarioSmtp || '',
          nomeRemetente: cfg.nomeRemetente || '',
          emailRemetente: cfg.emailRemetente || '',
          replyTo: cfg.replyTo || '',
          ativo: cfg.ativo ?? true
        });
      },
      error: err => {
        const status = err?.status as number | undefined;
        if (status === 403) {
          this.toast.showError('Sem permissão para visualizar a configuração SMTP.');
          return;
        }
        if (status === 401) {
          this.toast.showError('Sessão inválida. Faça login novamente.');
          return;
        }
        this.toast.showError('Não foi possível carregar a configuração SMTP.');
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.senhaObrigatoria && !this.form.value.senha?.trim()) {
      this.toast.showError('Informe a senha SMTP.');
      return;
    }
    this.saving = true;
    const v = this.form.getRawValue();
    this.api.salvar({
      ...v,
      senha: v.senha?.trim() || null,
      replyTo: v.replyTo?.trim() || null
    }).subscribe({
      next: cfg => {
        this.senhaConfigurada = !!cfg.senhaConfigurada;
        this.senhaRequerAtualizacao = !!cfg.senhaRequerAtualizacao;
        this.form.patchValue({ senha: '' });
        this.toast.showSuccess('Configuração SMTP salva.');
        this.saving = false;
      },
      error: err => {
        this.toast.showError(err?.error?.message || 'Falha ao salvar.');
        this.saving = false;
      }
    });
  }

  testarConexao(): void {
    this.testing = true;
    this.api.testarConexao().subscribe({
      next: r => {
        r.sucesso ? this.toast.showSuccess(r.mensagem) : this.toast.showError(r.mensagem);
        this.testing = false;
      },
      error: () => { this.toast.showError('Falha no teste de conexão.'); this.testing = false; }
    });
  }

  abrirTesteEnvio(): void {
    this.destTesteTocado = false;
    this.modalTeste = true;
  }

  fecharModalTeste(): void {
    if (this.testing) return;
    this.modalTeste = false;
    this.destTesteTocado = false;
  }

  emailDestinoValido(): boolean {
    const dest = this.destinoTeste.trim();
    if (!dest) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest);
  }

  enviarTeste(): void {
    this.destTesteTocado = true;
    const dest = this.destinoTeste.trim();
    if (!dest) {
      this.toast.showError('Informe o e-mail do destinatário.');
      return;
    }
    if (!this.emailDestinoValido()) {
      this.toast.showError('Informe um e-mail válido.');
      return;
    }
    this.testing = true;
    this.api.enviarTeste(dest).subscribe({
      next: r => {
        r.sucesso ? this.toast.showSuccess(r.mensagem) : this.toast.showError(r.mensagem);
        this.modalTeste = false;
        this.testing = false;
      },
      error: () => { this.toast.showError('Falha ao enviar teste.'); this.testing = false; }
    });
  }
}