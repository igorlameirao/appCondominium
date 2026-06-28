import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CondominioContextService } from './core/services/condominio-context.service';

interface MenuLink { label: string; route: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
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

  constructor(
    public auth: AuthService,
    public condominioCtx: CondominioContextService,
    private router: Router
  ) {}

  shouldShowMenu(): boolean {
    return this.auth.isLoggedIn && !this.router.url.startsWith('/login');
  }

  toggleGroup(label: string): void {
    if (this.openGroups.has(label)) this.openGroups.delete(label);
    else this.openGroups.add(label);
  }

  isGroupOpen(label: string): boolean { return this.openGroups.has(label); }

  logout(): void { this.auth.logout(); }
}
