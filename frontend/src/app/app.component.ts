import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { PushToastComponent } from './shared/push-toast/push-toast.component';
import { CondominioContextService } from './core/services/condominio-context.service';
import { PermissionService } from './core/services/permission.service';
import { VERSAO_SISTEMA } from './core/versao';
import { ComboboxCustomizadaComponent, ComboboxOption } from './shared/combobox-customizada/combobox-customizada.component';
import { Icone } from './shared/icone';
import { SidebarUsuarioComponent } from './shared/sidebar-usuario/sidebar-usuario.component';
import { ContaService } from './core/services/conta.service';

interface MenuLink { label: string; route: string; }

interface MenuGroup {
  label: string;
  icon: string;
  links: MenuLink[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, PushToastComponent, ComboboxCustomizadaComponent, Icone, SidebarUsuarioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private static readonly SIDEBAR_KEY = 'appcondominium-sidebar-collapsed';

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
    { label: 'Pessoas', icon: 'users', links: [
      { label: 'Pessoa Física', route: '/pessoafisica' }, { label: 'Pessoa Jurídica', route: '/pessoajuridica' },
      { label: 'Pessoa Condomínio', route: '/pessoacondominio' }, { label: 'Fornecedor', route: '/fornecedor' }
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
    { label: 'Permissões', icon: 'shield', links: [
      { label: 'Por perfil', route: '/gerenciamento-permissoes/perfil' },
      { label: 'Por pessoa', route: '/gerenciamento-permissoes/pessoa' }
    ]}
  ];

  openGroups = new Set<string>();
  condominiosAutorizados: { idCondominio: number; nome: string }[] = [];

  constructor(
    public auth: AuthService,
    public condominioCtx: CondominioContextService,
    public permissions: PermissionService,
    private router: Router,
    private conta: ContaService
  ) {}

  ngOnInit(): void {
    try {
      this.sidebarCollapsed = sessionStorage.getItem(AppComponent.SIDEBAR_KEY) === '1';
    } catch { /* sessionStorage indisponível */ }

    this.carregarSeNecessario();
    this.abrirGrupoDaRota();
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.carregarSeNecessario();
      if (!this.isDesktopLayout()) this.mobileMenuOpen = false;
      this.abrirGrupoDaRota();
    });
  }

  private carregarSeNecessario(): void {
    if (this.auth.isLoggedIn && !this.condominiosAutorizados.length) this.carregarCondominios();
  }

  get nomeCondominioAtivo(): string {
    const id = this.condominioCtx.idCondominio;
    return this.condominiosAutorizados.find(c => c.idCondominio === id)?.nome ?? '';
  }

  get tenantOptions(): ComboboxOption[] {
    return this.condominiosAutorizados.map(c => ({ value: c.idCondominio, label: c.nome }));
  }

  onTenantChange(value: number | string | null): void {
    if (value == null) return;
    this.trocarTenant(Number(value));
  }

  carregarCondominios(): void {
    this.auth.listCondominios().subscribe({
      next: items => this.condominiosAutorizados = items,
      error: () => this.condominiosAutorizados = []
    });
  }

  trocarTenant(id: number): void {
    if (!id || id === this.condominioCtx.idCondominio) return;
    this.auth.trocarCondominio(id).subscribe({
      next: () => this.router.navigate(['/inicio']).then(() => window.location.reload()),
      error: () => this.carregarCondominios()
    });
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
    return segs[0] !== 'inicio' && !segs[0]?.startsWith('gerenciamento-permissoes');
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
    return group.links.filter(link => this.permissions.can(this.keyOf(link.route), 'Visualizar'));
  }

  private keyOf(route: string): string {
    const path = route.replace(/^\//, '').toLowerCase();
    if (path.startsWith('gerenciamento-permissoes')) return 'PERMISSOES_GERENCIAR';
    const segment = path.split('/')[0];
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
