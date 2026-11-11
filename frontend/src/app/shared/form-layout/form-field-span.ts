/** Largura do campo na grade de 12 colunas dos formulários CRUD. */
export type FieldSpan = 'fg-col-2' | 'fg-col-3' | 'fg-col-4' | 'fg-col-6' | 'fg-col-12';

export type FieldKind =
  | 'pk'
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'documento'
  | 'combobox'
  | 'password'
  | 'textarea'
  | 'other';

export interface FieldSpanInput {
  name?: string;
  label?: string;
  kind?: FieldKind;
  maxLength?: number | null;
  isPk?: boolean;
}

/** Espelhado em tools/generate_from_spec.py (field_grid_class). */
export function fieldSpanClass(field: FieldSpanInput): FieldSpan {
  const name = field.name ?? '';
  const blob = `${field.label ?? ''} ${name}`;
  if (field.isPk || field.kind === 'pk') return 'fg-col-2';
  if (/nome|descri/i.test(blob)) return 'fg-col-12';
  if (field.kind === 'datetime') return 'fg-col-4';
  if (field.kind === 'date') return 'fg-col-2';
  if (field.kind === 'documento') return 'fg-col-3';
  if (field.kind === 'password') return 'fg-col-3';
  if (field.kind === 'textarea') return 'fg-col-12';
  if (field.maxLength != null) {
    if (field.maxLength <= 25) return 'fg-col-2';
    if (field.maxLength <= 50) return 'fg-col-3';
    if (field.maxLength <= 100) return 'fg-col-6';
    return 'fg-col-12';
  }
  if (field.kind === 'combobox') return 'fg-col-6';
  if (field.kind === 'number') return 'fg-col-2';
  return 'fg-col-6';
}
