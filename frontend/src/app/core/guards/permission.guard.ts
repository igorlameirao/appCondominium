import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const entityPermissionGuard: CanActivateChildFn = (child) => {
  const path = child.routeConfig?.path ?? '';
  const segment = path.split('/')[0];
  if (!segment) return true;

  const key = segment === 'inicio'
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
  if (permissions.can(key, 'Visualizar')) return true;
  return inject(Router).createUrlTree(['/inicio']);
};
