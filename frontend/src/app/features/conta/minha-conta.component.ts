import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { UsuarioFotoComponent } from '../../shared/foto-perfil/usuario-foto.component';
import { AlterarSenhaFormComponent } from '../../shared/alterar-senha/alterar-senha-form.component';
import { MinhaContaNotificacoesComponent } from './minha-conta-notificacoes.component';

const TENANT_LIST_CACHE_KEY = 'appcondominium-tenant-list-cache';

@Component({
  selector: 'app-minha-conta',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Icone,
    UsuarioFotoComponent,
    AlterarSenhaFormComponent,
    MinhaContaNotificacoesComponent,
  ],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page minha-conta-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Minha conta</span>
          </nav>
          <h1 class="cad-titulo">Minha conta</h1>
          <p class="cad-subtitulo">Atualize sua foto, senha e preferências de notificação.</p>
        </header>

        <section class="cad-card form-page minha-conta-card">
          <div class="cad-abas minha-conta-abas" role="tablist" aria-label="Seções da minha conta">
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="aba === 'conta'"
              (click)="selecionarAba('conta')"
              [attr.aria-selected]="aba === 'conta'"
            >
              <app-icone nome="user" [tamanho]="16" />
              <span>Conta</span>
            </button>
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="aba === 'senha'"
              (click)="selecionarAba('senha')"
              [attr.aria-selected]="aba === 'senha'"
            >
              <app-icone nome="lock" [tamanho]="16" />
              <span>Alterar senha</span>
            </button>
            <button
              type="button"
              role="tab"
              class="cad-aba"
              [class.cad-aba--ativa]="aba === 'notificacoes'"
              (click)="selecionarAba('notificacoes')"
              [attr.aria-selected]="aba === 'notificacoes'"
            >
              <app-icone nome="bell" [tamanho]="16" />
              <span>Notificações</span>
            </button>
          </div>

          <div
            #conteudoPainel
            class="minha-conta-card__conteudo cad-conteudo"
            [style.--minha-conta-painel-min.px]="alturaMinimaPainel || null">
            <div class="minha-conta-aba-painel" role="tabpanel" [hidden]="aba !== 'conta'">
              <div class="minha-conta-conta__grid">
                <article class="minha-conta-conta__perfil-card">
                  <div class="minha-conta-conta__perfil-corpo">
                    <div class="minha-conta-conta__foto">
                      <app-usuario-foto
                        #fotoUsuario
                        layout="pagina"
                        [fotoUrl]="conta.fotoUrl()"
                        [nome]="nome"
                        (fotoSelecionada)="enviarFoto($event)"
                        (fotoRemovida)="removerFoto()"
                      />
                    </div>
                    <h2 class="minha-conta-conta__nome">{{ nome }}</h2>
                    <p *ngIf="perfil" class="minha-conta-conta__badge">{{ perfil }}</p>
                    <p *ngIf="emailExibicao" class="minha-conta-conta__email-resumo">{{ emailExibicao }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn-filtrar minha-conta-conta__alterar"
                    (click)="abrirMenuFoto($event)">
                    <app-icone nome="camera" [tamanho]="14" />
                    Alterar foto
                  </button>
                </article>

                <div class="minha-conta-conta__coluna-direita">
                  <section class="minha-conta-conta__dados-card" aria-labelledby="minha-conta-dados-titulo">
                    <header class="minha-conta-conta__dados-cabecalho">
                      <span class="minha-conta-conta__dados-icone" aria-hidden="true">
                        <app-icone nome="user" [tamanho]="18" />
                      </span>
                      <h3 id="minha-conta-dados-titulo" class="minha-conta-conta__dados-titulo">Dados da conta</h3>
                    </header>
                    <ul class="minha-conta-conta__dados-lista">
                      <li class="minha-conta-conta__dados-item">
                        <span class="minha-conta-conta__dados-rotulo">
                          <app-icone nome="mail" [tamanho]="16" />
                          E-mail
                        </span>
                        <span class="minha-conta-conta__dados-valor">{{ emailRotulo }}</span>
                      </li>
                      <li class="minha-conta-conta__dados-item">
                        <span class="minha-conta-conta__dados-rotulo">
                          <app-icone nome="shield" [tamanho]="16" />
                          Perfil atual
                        </span>
                        <span class="minha-conta-conta__dados-valor">{{ perfilRotulo }}</span>
                      </li>
                      <li class="minha-conta-conta__dados-item">
                        <span class="minha-conta-conta__dados-rotulo">
                          <app-icone nome="building" [tamanho]="16" />
                          Condomínio ativo
                        </span>
                        <span class="minha-conta-conta__dados-valor">{{ nomeCondominioAtivo }}</span>
                      </li>
                      <li class="minha-conta-conta__dados-item minha-conta-conta__dados-item--ultimo">
                        <span class="minha-conta-conta__dados-rotulo">
                          <app-icone nome="home" [tamanho]="16" />
                          Unidade vinculada
                        </span>
                        <span class="minha-conta-conta__dados-valor">{{ unidadeVinculada }}</span>
                      </li>
                    </ul>
                  </section>

                  <aside class="minha-conta-conta__dica" aria-label="Dica de segurança">
                    <app-icone class="minha-conta-conta__dica-icone" nome="info" [tamanho]="18" />
                    <p class="minha-conta-conta__dica-texto">
                      Mantenha seus dados atualizados e utilize uma senha forte para proteger sua conta.
                    </p>
                  </aside>
                </div>
              </div>
            </div>

            <div class="minha-conta-aba-painel" role="tabpanel" [hidden]="aba !== 'senha'">
              <div class="minha-conta-senha__grid">
              <aside class="minha-conta-senha__painel" aria-labelledby="minha-conta-senha-titulo">
                <div class="minha-conta-senha__painel-icone">
                  <app-icone nome="lock" [tamanho]="26" />
                </div>
                <h3 id="minha-conta-senha-titulo" class="minha-conta-senha__painel-titulo">Alterar senha</h3>
                <p class="minha-conta-senha__painel-descricao">
                  Mantenha sua conta segura com uma senha forte e de uso exclusivo.
                </p>
                <div class="minha-conta-senha__painel-divisor" aria-hidden="true"></div>
                <ul class="minha-conta-senha__dicas">
                  <li>
                    <app-icone nome="check" [tamanho]="16" />
                    <span>Use pelo menos 8 caracteres.</span>
                  </li>
                  <li>
                    <app-icone nome="check" [tamanho]="16" />
                    <span>Combine letras, números e símbolos.</span>
                  </li>
                  <li>
                    <app-icone nome="check" [tamanho]="16" />
                    <span>Evite senhas fáceis, como seu nome ou data de nascimento.</span>
                  </li>
                </ul>
              </aside>
              <div class="minha-conta-senha__formulario">
                <app-alterar-senha-form
                  [embutido]="true"
                  idPrefix="minha-conta-senha-"
                  (cancelar)="voltarParaConta()" />
              </div>
            </div>
            </div>

            <div class="minha-conta-aba-painel" role="tabpanel" [hidden]="aba !== 'notificacoes'">
              <app-minha-conta-notificacoes />
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class MinhaContaComponent implements OnInit, AfterViewInit, OnDestroy {
  conta = inject(ContaService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private condominioCtx = inject(CondominioContextService);
  private tenantHost = inject(TenantHostService);

  aba: 'conta' | 'senha' | 'notificacoes' = 'conta';
  alturaMinimaPainel = 0;
  unidadeVinculada = 'Sem unidade vinculada';

  @ViewChild('conteudoPainel') private conteudoPainel?: ElementRef<HTMLElement>;
  @ViewChild('fotoUsuario') private fotoUsuario?: UsuarioFotoComponent;

  private resizeObs?: ResizeObserver;

  get nome(): string {
    return this.conta.perfil()?.nome ?? sessionStorage.getItem('nome') ?? 'Usuário';
  }

  get perfil(): string {
    return this.conta.perfil()?.perfil ?? sessionStorage.getItem('perfil') ?? '';
  }

  get email(): string | null | undefined {
    return this.conta.perfil()?.email;
  }

  get emailExibicao(): string {
    return this.email?.trim() ?? '';
  }

  get emailRotulo(): string {
    return this.emailExibicao || '—';
  }

  get perfilRotulo(): string {
    return this.perfil?.trim() || '—';
  }

  get nomeCondominioAtivo(): string {
    const id = this.condominioCtx.idCondominio;
    const daTenant = this.tenantHost.nomeCondominio?.trim();
    if (id == null) return daTenant || '—';
    try {
      const raw = sessionStorage.getItem(TENANT_LIST_CACHE_KEY);
      if (raw) {
        const lista = JSON.parse(raw) as { idCondominio: number; nome: string }[];
        const item = lista.find(c => Number(c.idCondominio) === Number(id));
        if (item?.nome?.trim()) return item.nome.trim();
      }
    } catch {
      /* cache inválido */
    }
    return daTenant || '—';
  }

  ngOnInit(): void {
    this.conta.carregarPerfil().subscribe({
      next: () => queueMicrotask(() => this.atualizarAlturaReferencia()),
      error: () => this.conta.sincronizarComSessao(),
    });

    this.auth.listarMinhasUnidades().subscribe({
      next: items => {
        const descricoes = (items ?? [])
          .map(u => u.descricao?.trim())
          .filter((d): d is string => !!d);
        this.unidadeVinculada = descricoes.length ? descricoes.join(' · ') : 'Sem unidade vinculada';
        queueMicrotask(() => this.atualizarAlturaReferencia());
      },
      error: () => {
        this.unidadeVinculada = 'Sem unidade vinculada';
        queueMicrotask(() => this.atualizarAlturaReferencia());
      },
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.atualizarAlturaReferencia();
      this.iniciarObservacaoAltura();
    });
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
  }

  @HostListener('window:resize')
  onRedimensionar(): void {
    this.atualizarAlturaReferencia();
  }

  selecionarAba(nova: 'conta' | 'senha' | 'notificacoes'): void {
    this.aba = nova;
    queueMicrotask(() => this.atualizarAlturaReferencia());
  }

  voltarParaConta(): void {
    this.selecionarAba('conta');
  }

  abrirMenuFoto(evento: Event): void {
    this.fotoUsuario?.alternarMenuFoto(evento);
  }

  enviarFoto(arquivo: File): void {
    this.conta.enviarFoto(arquivo).subscribe({
      next: () => this.toast.showSuccess('Foto atualizada.'),
      error: () => this.toast.showError('Não foi possível gravar a foto.'),
    });
  }

  removerFoto(): void {
    this.conta.removerFoto().subscribe({
      next: () => this.toast.showSuccess('Foto removida.'),
      error: () => this.toast.showError('Não foi possível remover a foto.'),
    });
  }

  private iniciarObservacaoAltura(): void {
    const container = this.conteudoPainel?.nativeElement;
    if (!container || typeof ResizeObserver === 'undefined') return;

    this.resizeObs?.disconnect();
    this.resizeObs = new ResizeObserver(() => this.atualizarAlturaReferencia());
    container.querySelectorAll('.minha-conta-aba-painel').forEach(painel => {
      this.resizeObs?.observe(painel);
    });
  }

  private atualizarAlturaReferencia(): void {
    if (typeof window === 'undefined' || window.innerWidth < 720) {
      this.alturaMinimaPainel = 0;
      return;
    }
    const container = this.conteudoPainel?.nativeElement;
    if (!container) return;

    const paineis = Array.from(container.querySelectorAll('.minha-conta-aba-painel')) as HTMLElement[];
    let maior = 0;

    for (const painel of paineis) {
      const estavaOculto = painel.hidden;
      painel.hidden = false;
      painel.classList.add('minha-conta-painel--medindo');
      const alvo =
        (painel.querySelector('.minha-conta-senha__grid') as HTMLElement | null) ??
        (painel.querySelector('.minha-conta-conta__grid') as HTMLElement | null) ??
        (painel.querySelector('.minha-conta-notificacoes__corpo') as HTMLElement | null) ??
        (painel.firstElementChild as HTMLElement | null) ??
        painel;
      maior = Math.max(maior, alvo.offsetHeight);
      painel.classList.remove('minha-conta-painel--medindo');
      painel.hidden = estavaOculto;
    }

    if (maior > 0) {
      this.alturaMinimaPainel = maior;
    }
  }
}