import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';
import { TenantHostService } from '../services/tenant-host.service';
import { prefixTenantUrl, stripTenantPrefix } from './tenant-url.util';

/**
 * Expõe URLs no formato /{identificador}/rota mantendo o roteamento Angular sem prefixo nos commands.
 */
@Injectable()
export class TenantUrlSerializer implements UrlSerializer {
  private readonly fallback = new DefaultUrlSerializer();

  constructor(private readonly tenant: TenantHostService) {}

  parse(url: string): UrlTree {
    const internal = stripTenantPrefix(url, this.tenant.urlSlug);
    return this.fallback.parse(internal);
  }

  serialize(tree: UrlTree): string {
    const internal = this.fallback.serialize(tree);
    return prefixTenantUrl(internal, this.tenant.urlSlug);
  }
}