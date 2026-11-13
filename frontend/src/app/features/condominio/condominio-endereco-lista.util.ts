import { Condominio } from './condominio.model';

function texto(valor?: string | null): string {
  return valor?.trim() ?? '';
}

export function condominioEnderecoPrincipal(item: Condominio): string {
  const logradouro = texto(item.enderecoLogradouro);
  const complemento = texto(item.complementoEndereco);
  const numero =
    item.numeroEndereco != null && item.numeroEndereco !== undefined
      ? String(item.numeroEndereco)
      : '';

  if (!item.idEndereco && !logradouro && !numero && !complemento) {
    return 'Endereço não cadastrado';
  }

  let linha: string;
  if (logradouro) {
    linha = numero ? `${logradouro}, ${numero}` : logradouro;
  } else if (item.idEndereco) {
    linha = numero ? `Logradouro não informado, ${numero}` : 'Logradouro não informado';
  } else if (numero) {
    linha = numero;
  } else {
    linha = 'Endereço não cadastrado';
  }

  if (complemento) {
    linha += ` - ${complemento}`;
  }

  return linha;
}

export function condominioEnderecoLocalizacao(item: Condominio): string {
  const bairro = texto(item.nomeBairro);
  const municipio = texto(item.nomeMunicipio);
  const uf = texto(item.siglaUf);

  let municipioUf = '';
  if (municipio && uf) municipioUf = `${municipio}/${uf}`;
  else if (municipio) municipioUf = municipio;
  else if (uf) municipioUf = uf;

  if (!item.idEndereco) {
    return 'Localização não cadastrada';
  }

  const esquerda = bairro || 'Bairro não informado';

  let direita = municipioUf;
  if (!direita) {
    if (municipio) direita = 'Município não informado';
    else if (uf) direita = 'UF não informada';
    else direita = 'Município/UF não informados';
  }

  return `${esquerda} — ${direita}`;
}
