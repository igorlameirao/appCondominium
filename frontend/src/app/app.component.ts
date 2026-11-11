import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { PushToastComponent } from './shared/push-toast/push-toast.component';
import { CondominioContextService } from './core/services/condominio-context.service';
import { PermissionService } from './core/services/permission.service';

interface MenuLink { label: string; route: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, PushToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  mobileMenuOpen = false;
  sidebarCollapsed = false;

  menuGroups: { label: string; links: MenuLink[] }[] = [
    { label: 'Cadastros Gerais', links: [
      { label: 'UF', route: '/uf' }, { label: 'Município', route: '/municipio' },
      { label: 'Bairro', route: '/bairro' }, { label: 'Endereço', route: '/endereco' },
      { label: 'Condomínio', route: '/condominio' }
    ]},
    { label: 'Condomínio', links: [
      { label: 'Configuração', route: '/configuracaocondominio' }, { label: 'Bloco', route: '/bloco' },
      { label: 'Tipo Unidade', route: '/tipounidade' }, { label: 'Unidade', route: '/unidade' },
      { label: 'Hidrômetro', route: '/hidrometro' }, { label: 'Consumo Água', route: '/consumoagua' }
    ]},
    { label: 'Pessoas', links: [
      { label: 'Pessoa Física', route: '/pessoafisica' }, { label: 'Pessoa Jurídica', route: '/pessoajuridica' },
      { label: 'Pessoa Condomínio', route: '/pessoacondominio' }, { label: 'Fornecedor', route: '/fornecedor' }
    ]},
    { label: 'Financeiro', links: [
      { label: 'Banco', route: '/banco' }, { label: 'Dados Bancários', route: '/dadosbancarios' },
      { label: 'Cobrança', route: '/cobranca' }, { label: 'Despesa', route: '/despesa' },
      { label: 'Tipo Despesa', route: '/tipodespesa' }
    ]},
    { label: 'Materiais', links: [
      { label: 'Material', route: '/material' }, { label: 'Alocação', route: '/alocacaomaterial' },
      { label: 'Estoque Consumo', route: '/estoquematerialconsumo' }, { label: 'Entrada/Saída', route: '/entradasaidamaterialconsumo' }
    ]},
    { label: 'Licitação', links: [
      { label: 'Concorrência', route: '/concorrencia' }, { label: 'Oferta', route: '/ofertaconcorrencia' }
    ]},
    { label: 'Outros', links: [
      { label: 'Guarda Encomenda', route: '/guardaencomenda' }, { label: 'Local', route: '/local' },
      { label: 'Aluguel Equipamento', route: '/aluguelequipamento' }
    ]}
  ];

  openGroups = new Set(this.menuGroups.map(g => g.label));
  condominiosAutorizados: { idCondominio: number; nome: string }[] = [];

  constructor(
    public auth: AuthService,
    public condominioCtx: CondominioContextService,
    public permissions: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarSeNecessario();
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => this.carregarSeNecessario());
  }

  private carregarSeNecessario(): void {
    if (this.auth.isLoggedIn && !this.condominiosAutorizados.length) this.carregarCondominios();
  }

  get nomeCondominioAtivo(): string {
    const id = this.condominioCtx.idCondominio;
    return this.condominiosAutorizados.find(c => c.idCondominio === id)?.nome ?? '';
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
    return segs[0] !== 'inicio' && segs[0] !== 'gerenciamento-permissoes';
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
    const segment = route.replace(/^\//, '').split('/')[0];
    return segment.toUpperCase();
  }

  podeGerenciar(): boolean {
    return this.permissions.can('PERMISSOES_GERENCIAR', 'Visualizar');
  }

  logout(): void { this.auth.logout(); }
}
