import { parseCorHex } from './cor-hex.util';

export interface CorRgb {
  r: number;
  g: number;
  b: number;
}

export interface CorCmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function hexParaRgb(hex: string): CorRgb | null {
  const h = parseCorHex(hex);
  if (!h) return null;
  const n = h.slice(1);
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function rgbParaHex(rgb: CorRgb): string | null {
  const { r, g, b } = rgb;
  if ([r, g, b].some(v => !Number.isFinite(v) || v < 0 || v > 255)) return null;
  const p = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`.toUpperCase();
}

/** CMYK em percentuais 0–100; conversão aproximada para RGB (tela). */
export function cmykParaRgb(cmyk: CorCmyk): CorRgb | null {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;
  if ([c, m, y, k].some(v => !Number.isFinite(v) || v < 0 || v > 1)) return null;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

export function rgbParaCmyk(rgb: CorRgb): CorCmyk {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function formatarRgb(rgb: CorRgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatarCmyk(cmyk: CorCmyk): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

export function parseRgb(texto: string): CorRgb | null {
  const t = texto.trim().replace(/^rgb\(\s*/i, '').replace(/\s*\)$/, '');
  const partes = t.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  if (partes.length !== 3) return null;
  const nums = partes.map(p => Number(p.replace('%', '')));
  if (nums.some(n => !Number.isFinite(n))) return null;
  if (nums.every(n => n >= 0 && n <= 1)) {
    return { r: Math.round(nums[0] * 255), g: Math.round(nums[1] * 255), b: Math.round(nums[2] * 255) };
  }
  if (nums.every(n => n >= 0 && n <= 255)) {
    return { r: Math.round(nums[0]), g: Math.round(nums[1]), b: Math.round(nums[2]) };
  }
  return null;
}

export function parseCmyk(texto: string): CorCmyk | null {
  const t = texto.trim().replace(/^cmyk\(\s*/i, '').replace(/\s*\)$/, '');
  const partes = t.split(/[\s,;]+/).map(s => s.replace('%', '').trim()).filter(Boolean);
  if (partes.length !== 4) return null;
  const nums = partes.map(Number);
  if (nums.some(n => !Number.isFinite(n) || n < 0 || n > 100)) return null;
  return { c: nums[0], m: nums[1], y: nums[2], k: nums[3] };
}

export type FormatoCor = 'hex' | 'rgb' | 'cmyk';

export function textoParaHex(texto: string, formato: FormatoCor): string | null {
  if (formato === 'hex') return parseCorHex(texto);
  if (formato === 'rgb') {
    const rgb = parseRgb(texto);
    return rgb ? rgbParaHex(rgb) : null;
  }
  const cmyk = parseCmyk(texto);
  if (!cmyk) return null;
  const rgb = cmykParaRgb(cmyk);
  return rgb ? rgbParaHex(rgb) : null;
}

export function hexParaTexto(hex: string, formato: FormatoCor): string {
  const rgb = hexParaRgb(hex);
  if (!rgb) return hex;
  if (formato === 'hex') return parseCorHex(hex) ?? hex;
  if (formato === 'rgb') return formatarRgb(rgb);
  return formatarCmyk(rgbParaCmyk(rgb));
}

export const HUG_PALETA_CORES: ReadonlyArray<{ nome: string; hex: string }> = [
  { nome: 'Azul Petróleo', hex: '#0E7490' },
  { nome: 'Azul Marinho', hex: '#1E3A5F' },
  { nome: 'Ciano', hex: '#0891B2' },
  { nome: 'Verde', hex: '#15803D' },
  { nome: 'Verde Claro', hex: '#22C55E' },
  { nome: 'Amarelo', hex: '#EAB308' },
  { nome: 'Âmbar', hex: '#D97706' },
  { nome: 'Vermelho', hex: '#DC2626' },
  { nome: 'Rosa', hex: '#DB2777' },
  { nome: 'Roxo', hex: '#7C3AED' },
  { nome: 'Grafite', hex: '#334155' },
  { nome: 'Preto', hex: '#0F172A' },
  { nome: 'Branco', hex: '#F8FAFC' },
];

/** Nome amigável da paleta ou rótulo genérico para cores fora da paleta. */
export function nomeCorPorHex(hex: string | null | undefined): string {
  const norm = parseCorHex(hex);
  if (!norm) return 'Cor personalizada';
  const exata = HUG_PALETA_CORES.find(c => c.hex === norm);
  if (exata) return exata.nome;
  return 'Cor personalizada';
}
