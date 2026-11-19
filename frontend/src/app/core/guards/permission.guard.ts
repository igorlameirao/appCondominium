import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import {
  CHAVES_PERMISSAO_COLABORADOR,
  CHAVES_PERMISSAO_GESTOR,
  CHAVES_PERMISSAO_OCUPANTE,
  contextosDeMenu,
  ehContextoColaborador,
  ehContextoGestor,
  ehContextoOcupante,
} from '../../features/pessoas/pessoa-contexto.config';

export const entityPermissionGuard: CanActivateChildFn = (child) => {
  const path = child.routeConfig?.path ?? '';
  const segment = path.split('/')[0];
  if (!segment) return true;

  const contexto = contextosDeMenu().find(c => c.routeLista.replace(/^\//, '').split('/')[0] === segment);
  const key = contexto
    ? contexto.permissionKey
    : segment === 'inicio'
    ? 'HOME'
    : segment === 'gerenciamento-permissoes'
      ? 'PERMISSOES_GERENCIAR'
      : segment === 'fila-email'
        ? 'FILAEMAIL'
        : segment === 'configuracao-email'
          ? 'CONFIGURACAOEMAIL'
          : segment.toUpperCase();

  if (key === 'HOME' || segment === 'minha-conta') return true;
  const permissions = inject(PermissionService);
  if (segment === 'pessoas') {
    if (permissions.canAny(['PESSOAFISICA', 'PESSOAJURIDICA'], 'Visualizar')) return true;
    return inject(Router).createUrlTree(['/inicio']);
  }
  if ((key === 'FILAEMAIL' || key === 'CONFIGURACAOEMAIL') && permissions.acessoTotal) return true;
  if (contexto && ehContextoColaborador(contexto.id)) {
    if (permissions.canAny([...CHAVES_PERMISSAO_COLABORADOR], 'Visualizar')) return true;
    return inject(Router).createUrlTree(['/inicio']);
  }
  if (contexto && ehContextoOcupante(contexto.id)) {
    if (permissions.canAny([...CHAVES_PERMISSAO_OCUPANTE], 'Visualizar')) return true;
    return inject(Router).createUrlTree(['/inicio']);
  }
  if (contexto && ehContextoGestor(contexto.id)) {
    if (permissions.canAny([...CHAVES_PERMISSAO_GESTOR], 'Visualizar')) return true;
    return inject(Router).createUrlTree(['/inicio']);
  }
  if (permissions.can(key, 'Visualizar')) return true;
  return inject(Router).createUrlTree(['/inicio']);
};
