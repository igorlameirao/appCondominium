import { firstPathSegment, prefixTenantUrl, stripTenantPrefix } from './tenant-url.util';

describe('tenant-url.util', () => {
  it('stripTenantPrefix remove slug', () => {
    expect(stripTenantPrefix('/residencial/inicio', 'residencial')).toBe('/inicio');
    expect(stripTenantPrefix('/residencial', 'residencial')).toBe('/');
  });

  it('prefixTenantUrl adiciona slug', () => {
    expect(prefixTenantUrl('/inicio', 'residencial')).toBe('/residencial/inicio');
    expect(prefixTenantUrl('/', 'residencial')).toBe('/residencial/');
  });

  it('firstPathSegment', () => {
    expect(firstPathSegment('/meu-cond/bloco')).toBe('meu-cond');
    expect(firstPathSegment('/login')).toBe('login');
  });
});