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
      : segment.toUpperCase();

  if (key === 'HOME' || segment === 'minha-conta') return true;
  const permissions = inject(PermissionService);
  if (permissions.can(key, 'Visualizar')) return true;
  return inject(Router).createUrlTree(['/inicio']);
};
