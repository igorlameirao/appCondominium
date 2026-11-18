import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { LookupService } from './core/services/lookup.service';
import {
  SIDEBAR_ICONE_PADRAO,
  urlImagemIconeSidebar,
} from './features/auth/login-condominio-tema.util';
import { PushToastComponent } from './shared/push-toast/push-toast.component';
import { CondominioContextService } from './core/services/condominio-context.service';
import { PermissionService } from './core/services/permission.service';
import { VERSAO_SISTEMA } from './core/versao';
import { Icone } from './shared/icone';
import { SidebarUsuarioComponent } from './shared/sidebar-usuario/sidebar-usuario.component';
import { ContaService } from './core/services/conta.service';
import { TenantHostService } from './core/services/tenant-host.service';
import { ToastService } from './core/services/toast.service';
import {
  CondominioTrocaItem,
  TrocarCondominioModalComponent,
} from './shared/trocar-condominio/trocar-condominio-modal.component';
import { CHAVES_PERMISSAO_COLABORADOR, contextosDeMenu } from './features/pessoas/pessoa-contexto.config';

interface MenuLink { label: string; route: string; }

interface MenuGroup {
  label: string;
  icon: string;
  links: MenuLink[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, PushToastComponent, Icone, SidebarUsuarioComponent, TrocarCondominioModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private static readonly SIDEBAR_KEY = 'appcondominium-sidebar-collapsed';
  private static readonly TENANT_SWITCH_TOAST_KEY = 'appcondominium-tenant-switch-ok';
  private static readonly TENANT_LIST_CACHE_KEY = 'appcondominium-tenant-list-cache';
  /** Animações fixas de UX na troca (~50ms + ~120ms; meta total percebida ~2s com API/reload). */
  private static readonly TENANT_FADE_OUT_MS = 50;
  private static readonly TENANT_FADE_IN_MS = 120;

  readonly versao = VERSAO_SISTEMA;

  mobileMenuOpen = false;
  sidebarCollapsed = false;

  menuGroups: MenuGroup[] = [
    { label: 'Cadastros Gerais', icon: 'map-pin', links: [
      { label: 'UF', route: '/uf' }, { label: 'Município', route: '/municipio' },
      { label: 'Bairro', route: '/bairro' },
      { label: 'Condomínio', route: '/condominio' }
    ]},
    { label: 'Condomínio', icon: 'building', links: [
      { label: 'Configuração', route: '/configuracaocondominio' }, { label: 'Bloco', route: '/bloco' },
      { label: 'Tipo Unidade', route: '/tipounidade' }, { label: 'Unidade', route: '/unidade' },
      { label: 'Hidrômetro', route: '/hidrometro' }, { label: 'Consumo Água', route: '/consumoagua' }
    ]},
    { label: 'Pessoas e Vínculos', icon: 'users', links: [
      { label: 'Moradores', route: '/moradores' },
      { label: 'Proprietários', route: '/proprietarios' },
      { label: 'Locatários', route: '/locatarios' },
      { label: 'Prestadores (unidade)', route: '/prestadores-unidade' },
      { label: 'Visitantes', route: '/visitantes' },
      { label: 'Representantes legais', route: '/representantes-legais' },
      { label: 'Colaborador', route: '/colaboradores' },
      { label: 'Prestadores (condomínio)', route: '/prestadores' },
      { label: 'Fornecedores', route: '/fornecedores' },
      { label: 'Síndicos', route: '/sindicos' },
      { label: 'Subsíndicos', route: '/subsindicos' },
      { label: 'Conselheiros', route: '/conselheiros' },
      { label: 'Administradoras', route: '/administradoras' },
      { label: 'Entregadores', route: '/entregadores' },
      { label: 'Funções de colaborador', route: '/funcaocolaborador' },
      { label: 'Convites', route: '/convites' }
    ]},
    { label: 'Financeiro', icon: 'wallet', links: [
      { label: 'Banco', route: '/banco' }, { label: 'Dados Bancários', route: '/dadosbancarios' },
      { label: 'Cobrança', route: '/cobranca' }, { label: 'Despesa', route: '/despesa' },
      { label: 'Tipo Despesa', route: '/tipodespesa' }
    ]},
    { label: 'Materiais', icon: 'clipboard-list', links: [
      { label: 'Material', route: '/material' }, { label: 'Alocação', route: '/alocacaomaterial' },
      { label: 'Estoque Consumo', route: '/estoquematerialconsumo' }, { label: 'Entrada/Saída', route: '/entradasaidamaterialconsumo' }
    ]},
    { label: 'Licitação', icon: 'handshake', links: [
      { label: 'Concorrência', route: '/concorrencia' }, { label: 'Oferta', route: '/ofertaconcorrencia' }
    ]},
    { label: 'Outros', icon: 'layers', links: [
      { label: 'Guarda Encomenda', route: '/guardaencomenda' }, { label: 'Local', route: '/local' },
      { label: 'Aluguel Equipamento', route: '/aluguelequipamento' }
    ]},
    { label: 'Administração', icon: 'settings', links: [
      { label: 'Fila de E-mails', route: '/fila-email' },
      { label: 'Configuração SMTP', route: '/configuracao-email' }
    ]},
    { label: 'Permissões', icon: 'shield', links: [
      { label: 'Por perfil', route: '/gerenciamento-permissoes/perfil' },
      { label: 'Por pessoa', route: '/gerenciamento-permissoes/pessoa' }
    ]}
  ];

  openGroups = new Set<string>();
  condominiosAutorizados: CondominioTrocaItem[] = [];

  modalTrocarAberto = false;
  selecaoCondominioModal: number | null = null;
  trocandoTenant = false;
  tenantTransicao: 'idle' | 'saindo' | 'carregando' | 'entrando' = 'idle';
  mainEntrandoVisivel = false;
  nomeCondominioCarregando = '';
  /** Atualiza o rodapé imediatamente ao confirmar troca (antes do reload). */
  private nomeCondominioPainelOverride: string | null = null;

  readonly sidebarIconePadrao = SIDEBAR_ICONE_PADRAO;
  sidebarIconeSrc = SIDEBAR_ICONE_PADRAO;

  constructor(
    public auth: AuthService,
    public condominioCtx: CondominioContextService,
    public permissions: PermissionService,
    private router: Router,
    private conta: ContaService,
    private tenantHost: TenantHostService,
    private toast: ToastService,
    private lookup: LookupService
  ) {}

  ngOnInit(): void {
    try {
      this.sidebarCollapsed = sessionStorage.getItem(AppComponent.SIDEBAR_KEY) === '1';
    } catch { /* sessionStorage indisponível */ }

    this.restaurarListaCondominiosCache();
    this.carregarSeNecessario();
    this.abrirGrupoDaRota();
    this.finalizarTransicaoPosTroca();
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.carregarSeNecessario();
      this.carregarIconeSidebar();
      if (!this.isDesktopLayout()) this.mobileMenuOpen = false;
      this.abrirGrupoDaRota();
    });
    this.carregarIconeSidebar();
  }

  private carregarSeNecessario(): void {
    if (!this.auth.isLoggedIn) return;
    const id = this.condominioCtx.idCondominio;
    const faltaAtivo = id != null && !this.condominiosAutorizados.some(c => Number(c.idCondominio) === Number(id));
    if (!this.condominiosAutorizados.length || faltaAtivo) this.carregarCondominios();
  }

  get exibirTrocaCondominio(): boolean {
    return this.condominiosAutorizados.length > 1;
  }

  get nomeCondominioAtivo(): string {
    const override = this.nomeCondominioPainelOverride?.trim();
    if (override) return override;
    const id = this.condominioCtx.idCondominio;
    const daLista = this.condominiosAutorizados.find(c => Number(c.idCondominio) === Number(id))?.nome;
    return daLista || this.tenantHost.nomeCondominio || '';
  }

  private restaurarListaCondominiosCache(): void {
    try {
      const raw = sessionStorage.getItem(AppComponent.TENANT_LIST_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CondominioTrocaItem[];
      if (Array.isArray(parsed) && parsed.length) {
        this.condominiosAutorizados = parsed;
      }
    } catch {
      /* cache inválido */
    }
  }

  private persistirListaCondominiosCache(): void {
    try {
      if (this.condominiosAutorizados.length) {
        sessionStorage.setItem(
          AppComponent.TENANT_LIST_CACHE_KEY,
          JSON.stringify(this.condominiosAutorizados)
        );
      }
    } catch {
      /* sessionStorage indisponível */
    }
  }

  abrirModalTrocar(): void {
    if (this.trocandoTenant) return;
    this.selecaoCondominioModal = null;
    this.carregarCondominios();
    this.modalTrocarAberto = true;
  }

  fecharModalTrocar(): void {
    if (this.trocandoTenant) return;
    this.modalTrocarAberto = false;
    this.selecaoCondominioModal = null;
  }

  onSelecionarCondominioModal(id: number | null): void {
    this.selecaoCondominioModal = id != null ? Number(id) : null;
  }

  confirmarTrocaModal(id: number): void {
    if (this.trocandoTenant || !id || id === this.condominioCtx.idCondominio) return;
    const nome =
      this.condominiosAutorizados.find(c => Number(c.idCondominio) === Number(id))?.nome ?? '';
    this.nomeCondominioPainelOverride = nome || null;
    this.nomeCondominioCarregando = nome;
    this.modalTrocarAberto = false;
    this.selecaoCondominioModal = null;
    this.trocandoTenant = true;
    this.iniciarTransicaoTenant(id);
  }

  carregarCondominios(): void {
    this.auth.listarVinculosAtivos().subscribe({
      next: items => {
        this.condominiosAutorizados = (items ?? []).map(c => ({
          idCondominio: c.idCondominio,
          nome: c.nome,
          dominio: c.dominio ?? null,
          enderecoResumo: c.enderecoResumo ?? null,
        }));
        this.persistirListaCondominiosCache();
        this.sincronizarNomePainelAposCarga();
      },
      error: () => {
        this.auth.listCondominios().subscribe({
          next: items => {
            this.condominiosAutorizados = (items ?? []).map(c => ({
              idCondominio: c.idCondominio,
              nome: c.nome,
            }));
            this.persistirListaCondominiosCache();
            this.sincronizarNomePainelAposCarga();
          },
          error: () => (this.condominiosAutorizados = []),
        });
      },
    });
  }

  private sincronizarNomePainelAposCarga(): void {
    const id = this.condominioCtx.idCondominio;
    if (id == null) return;
    const nome = this.condominiosAutorizados.find(c => Number(c.idCondominio) === Number(id))?.nome;
    if (nome) this.nomeCondominioPainelOverride = null;
    this.carregarIconeSidebar();
  }

  private carregarIconeSidebar(): void {
    if (!this.auth.isLoggedIn) {
      this.sidebarIconeSrc = this.sidebarIconePadrao;
      return;
    }
    const id = this.condominioCtx.idCondominio;
    if (id == null) {
      this.sidebarIconeSrc = this.sidebarIconePadrao;
      return;
    }
    this.lookup.configuracaoPorCondominio(id).subscribe({
      next: cfg => {
        this.sidebarIconeSrc = urlImagemIconeSidebar(id, cfg) ?? this.sidebarIconePadrao;
      },
      error: () => {
        this.sidebarIconeSrc = this.sidebarIconePadrao;
      },
    });
  }

  private iniciarTransicaoTenant(id: number): void {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeOutMs = reducedMotion ? 0 : AppComponent.TENANT_FADE_OUT_MS;
    const chamarTroca = () => {
      this.auth.trocarCondominio(id).subscribe({
        next: () => {
          try {
            sessionStorage.setItem(AppComponent.TENANT_SWITCH_TOAST_KEY, '1');
          } catch {
            /* sessionStorage indisponível */
          }
          void this.redirecionarAposTrocaTenant(id);
        },
        error: () => {
          this.trocandoTenant = false;
          this.tenantTransicao = 'idle';
          this.nomeCondominioCarregando = '';
          this.nomeCondominioPainelOverride = null;
          this.toast.showError('Não foi possível alterar o condomínio. Tente novamente.');
          this.carregarCondominios();
        },
      });
    };

    this.tenantTransicao = reducedMotion ? 'carregando' : 'saindo';
    chamarTroca();
    if (fadeOutMs > 0) {
      window.setTimeout(() => {
        if (this.trocandoTenant) this.tenantTransicao = 'carregando';
      }, fadeOutMs);
    }
  }

  private finalizarTransicaoPosTroca(): void {
    let pendente = false;
    try {
      pendente = sessionStorage.getItem(AppComponent.TENANT_SWITCH_TOAST_KEY) === '1';
    } catch {
      pendente = false;
    }
    if (!pendente) return;

    try {
      sessionStorage.removeItem(AppComponent.TENANT_SWITCH_TOAST_KEY);
    } catch {
      /* ignora */
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      this.toast.showSuccess('Condomínio alterado com sucesso');
      return;
    }

    this.tenantTransicao = 'entrando';
    this.mainEntrandoVisivel = false;
    requestAnimationFrame(() => {
      this.mainEntrandoVisivel = true;
      window.setTimeout(() => {
        this.tenantTransicao = 'idle';
        this.mainEntrandoVisivel = false;
        this.toast.showSuccess('Condomínio alterado com sucesso');
      }, AppComponent.TENANT_FADE_IN_MS);
    });
  }

  private async redirecionarAposTrocaTenant(idCondominio: number): Promise<void> {
    if (this.tenantHost.isTenantHost) {
      const daLista = this.condominiosAutorizados
        .find(c => Number(c.idCondominio) === Number(idCondominio))
        ?.dominio?.trim()
        .toLowerCase();
      const slug = daLista || (await this.tenantHost.slugForCondominio(idCondominio));
      if (slug) {
        window.location.assign(`/${encodeURIComponent(slug)}/inicio`);
        return;
      }
    }
    window.location.assign('/inicio');
  }

  shouldShowMenu(): boolean {
    return this.auth.isLoggedIn && !this.router.url.startsWith('/login');
  }

  hugShell(): boolean {
    const path = this.routePath();
    return this.auth.isLoggedIn && !path.startsWith('/login') && !path.startsWith('/entrar');
  }

  isEntityListRoute(): boolean {
    if (!this.hugShell()) return false;
    const segs = this.routePath().split('/').filter(Boolean);
    if (segs.length !== 1) return false;
    return segs[0] !== 'inicio'
      && segs[0] !== 'configuracao-email'
      && !segs[0]?.startsWith('gerenciamento-permissoes');
  }

  isEntityFormRoute(): boolean {
    return this.hugShell() && !this.isEntityListRoute();
  }

  private routePath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  toggleGroup(label: string): void {
    if (this.openGroups.has(label)) this.openGroups.delete(label);
    else this.openGroups.add(label);
  }

  isGroupOpen(label: string): boolean { return this.openGroups.has(label); }

  visibleLinks(group: { links: MenuLink[] }): MenuLink[] {
    return group.links.filter(link => this.canVisualizarRota(link.route));
  }

  private canVisualizarRota(route: string): boolean {
    const path = route.replace(/^\//, '').toLowerCase();
    if (path === 'fila-email' || path === 'configuracao-email') {
      return this.permissions.acessoTotal;
    }
    if (path === 'pessoas') {
      return this.permissions.canAny(['PESSOAFISICA', 'PESSOAJURIDICA'], 'Visualizar');
    }
    if (path === 'colaboradores' || path.startsWith('colaboradores/')) {
      return this.permissions.canAny([...CHAVES_PERMISSAO_COLABORADOR], 'Visualizar');
    }
    return this.permissions.can(this.keyOf(route), 'Visualizar');
  }

  private keyOf(route: string): string {
    const path = route.replace(/^\//, '').toLowerCase();
    if (path.startsWith('gerenciamento-permissoes')) return 'PERMISSOES_GERENCIAR';
    const segment = path.split('/')[0];
    const contexto = contextosDeMenu().find(c => c.routeLista.replace(/^\//, '').split('/')[0] === segment);
    if (contexto) return contexto.permissionKey;
    return segment.toUpperCase();
  }

  logout(): void {
    this.conta.limpar();
    this.auth.logout();
  }

  isDesktopLayout(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  }

  showTopstripBrand(): boolean {
    if (this.isDesktopLayout()) return this.sidebarCollapsed;
    return !this.mobileMenuOpen;
  }

  topstripMenuAriaLabel(): string {
    if (this.isDesktopLayout() && this.sidebarCollapsed) return 'Expandir menu lateral';
    return 'Abrir menu';
  }

  onTopstripMenuToggle(): void {
    if (this.isDesktopLayout()) {
      if (this.sidebarCollapsed) {
        this.sidebarCollapsed = false;
        this.persistirSidebar();
      }
      return;
    }
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  collapseSidebarDesktop(): void {
    if (!this.isDesktopLayout()) return;
    this.sidebarCollapsed = true;
    this.mobileMenuOpen = false;
    this.persistirSidebar();
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onSidebarNavClick(): void {
    if (!this.isDesktopLayout()) this.mobileMenuOpen = false;
  }

  private persistirSidebar(): void {
    try {
      sessionStorage.setItem(AppComponent.SIDEBAR_KEY, this.sidebarCollapsed ? '1' : '0');
    } catch { /* ignora */ }
  }

  private abrirGrupoDaRota(): void {
    const path = this.routePath().toLowerCase();
    if (path.startsWith('/gerenciamento-permissoes')) {
      this.openGroups.add('Permissões');
      return;
    }
    const segment = path.split('/').filter(Boolean)[0] ?? '';
    if (!segment || segment === 'inicio') return;
    for (const group of this.menuGroups) {
      if (group.links.some(link => link.route.replace(/^\//, '').split('/')[0].toLowerCase() === segment)) {
        this.openGroups.add(group.label);
      }
    }
  }
}
