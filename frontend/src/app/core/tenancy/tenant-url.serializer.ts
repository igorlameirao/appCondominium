import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlSerializer, UrlTree } from '@angular/router';
import { TenantHostService } from '../services/tenant-host.service';
import { isReservedTenantSlug } from './tenant-route.constants';
import { firstPathSegment, prefixTenantUrl, stripTenantPrefix } from './tenant-url.util';

/**
 * Expõe URLs no formato /{identificador}/rota mantendo o roteamento Angular sem prefixo nos commands.
 */
@Injectable()
export class TenantUrlSerializer implements UrlSerializer {
  private readonly fallback = new DefaultUrlSerializer();

  constructor(private readonly tenant: TenantHostService) {}

  parse(url: string): UrlTree {
    const slug = this.slugForStrip(url);
    const internal = stripTenantPrefix(url, slug);
    return this.fallback.parse(internal);
  }

  private slugForStrip(url: string): string | null {
    if (this.tenant.urlSlug) return this.tenant.urlSlug;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    const segment = firstPathSegment(normalized);
    if (!segment || isReservedTenantSlug(segment)) return null;
    return segment;
  }

  serialize(tree: UrlTree): string {
    const internal = this.fallback.serialize(tree);
    return prefixTenantUrl(internal, this.tenant.urlSlug);
  }
}