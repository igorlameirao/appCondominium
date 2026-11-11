import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Icone } from '../../shared/icone';
import {
  CAMPOS_ACAO,
  CampoAcao,
  ModuloPermissao,
  PermissaoLinha,
  ROTULO_ACAO,
  agruparPorModulo,
  alternarLinha,
  alternarModulo,
  definirAcao,
  linhaIndeterminada,
  linhaMarcada,
  moduloIndeterminado,
  moduloMarcado,
  valorAcao,
} from './permissoes.util';

@Component({
  selector: 'app-permissoes-matriz',
  standalone: true,
  imports: [CommonModule, Icone],
  templateUrl: './permissoes-matriz.component.html',
})
export class PermissoesMatrizComponent {
  @Input() linhas: PermissaoLinha[] = [];
  @Input() modo: 'perfil' | 'pessoa' = 'perfil';
  @Input() podeAlterar = false;
  @Input() modulosExpandidos = new Set<string>();
  readonly campos = CAMPOS_ACAO;
  readonly colunas = CAMPOS_ACAO.map(c => ROTULO_ACAO[c]);

  private mapaPerfil = new Map<string, PermissaoLinha>();

  /** Baseline do perfil (somente modo pessoa). */
  @Input() set linhasPerfil(v: PermissaoLinha[]) {
    const lista = v ?? [];
    this.mapaPerfil = new Map(lista.map(l => [l.permissionKey.toLowerCase(), l]));
  }

  get modulos(): ModuloPermissao[] {
    return agruparPorModulo(this.linhas);
  }

  moduloExpandido(modulo: string): boolean {
    return this.modulosExpandidos.has(modulo);
  }

  alternarModuloExpandido(modulo: string): void {
    if (this.modulosExpandidos.has(modulo)) this.modulosExpandidos.delete(modulo);
    else this.modulosExpandidos.add(modulo);
  }

  rotuloAcao(campo: CampoAcao): string {
    return ROTULO_ACAO[campo];
  }

  valorAcao(linha: PermissaoLinha, campo: CampoAcao): boolean {
    return valorAcao(linha, campo);
  }

  definirAcao(linha: PermissaoLinha, campo: CampoAcao, ligado: boolean): void {
    definirAcao(linha, campo, ligado);
  }

  linhaMarcada(linha: PermissaoLinha): boolean {
    return linhaMarcada(linha);
  }

  linhaIndeterminada(linha: PermissaoLinha): boolean {
    return linhaIndeterminada(linha);
  }

  alternarLinha(linha: PermissaoLinha, ligado: boolean): void {
    alternarLinha(linha, ligado);
  }

  moduloMarcado(grupo: ModuloPermissao): boolean {
    return moduloMarcado(grupo);
  }

  moduloIndeterminado(grupo: ModuloPermissao): boolean {
    return moduloIndeterminado(grupo);
  }

  alternarModulo(grupo: ModuloPermissao, ligado: boolean): void {
    alternarModulo(grupo, ligado);
  }

  difereDoPerfil(linha: PermissaoLinha, campo: CampoAcao): boolean {
    if (this.modo !== 'pessoa') return false;
    const base = this.mapaPerfil.get(linha.permissionKey.toLowerCase());
    if (!base) return linha[campo];
    return base[campo] !== linha[campo];
  }
}
