export interface Banco {
  idBanco?: number;
  codigoBanco?: string | null;
  digitoVerificador?: string | null;
  nome?: string;
  ispb?: string;
  cnpj?: string | null;
  ativo?: number;
}