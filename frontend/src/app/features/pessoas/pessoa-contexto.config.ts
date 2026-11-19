import { PapelVinculoCodigo } from './pessoa-contexto-codigos';

export type TipoPessoaContexto = 'PF' | 'PF_OU_PJ' | 'ANY';
export type EscopoPapelContexto = 'unidade' | 'condominio' | 'pessoa' | 'qualquer';
export type AbaPessoa = 'dados' | 'foto' | 'contatos' | 'enderecos' | 'vinculoContexto' | 'vinculos' | 'autorizacoes';
export type TipoDadoVinculo = 'colaborador' | 'fornecedor';

export interface CamposObrigatoriosContexto {
  pessoaNova: string[];
  pessoaExistente: string[];
  vinculoContexto: {
    vinculo: string[];
    colaborador: string[];
    fornecedor: string[];
  };
  endereco: string[];
}

export interface PessoaContextoConfig {
  id: string;
  routeLista: string;
  routeDetalhe: string;
  routeNovo: string;
  permissionKey: string;
  tituloLista: string;
  subtituloLista: string;
  tipoPessoa: TipoPessoaContexto;
  escopoPapel: EscopoPapelContexto;
  codigosPapel: number[];
  abasDetalhe: AbaPessoa[];
  vinculoContexto: { tiposDado: TipoDadoVinculo[] };
  camposObrigatorios: CamposObrigatoriosContexto;
  inclusao: { codigoPapelPadrao: number; documento: 'cpf' | 'cpf_ou_cnpj' | 'cnpj'; tipoColaborador?: 1 | 2 } | null;
}

const vinculoUnidade = ['codigoPapelVinculo', 'idUnidade', 'dataInicio'];
const vinculoCondominio = ['codigoPapelVinculo', 'dataInicio'];
const vinculoPessoa = ['codigoPapelVinculo', 'idPessoaRelacionada', 'dataInicio'];
const pessoaPf = ['cpfcnpj', 'nome', 'dataNascimento'];
const pessoaPjOuPf = ['cpfcnpj', 'nome'];
const colaboradorObrigatorio = ['dataAdmissao', 'ctps', 'idFuncaoColaborador'];

function campos(
  pessoaNova: string[],
  vinculo: string[],
  colaborador: string[] = []
): CamposObrigatoriosContexto {
  return {
    pessoaNova,
    pessoaExistente: [],
    vinculoContexto: { vinculo, colaborador, fornecedor: [] },
    endereco: [],
  };
}

function ctx(partial: PessoaContextoConfig): PessoaContextoConfig {
  return partial;
}

export const PESSOA_CONTEXTOS: PessoaContextoConfig[] = [
  ctx({
    id: 'pessoas',
    routeLista: '/pessoas',
    routeDetalhe: '/pessoas/:idPessoa',
    routeNovo: '',
    permissionKey: 'PESSOAS',
    tituloLista: 'Pessoas',
    subtituloLista: 'Hub de pessoas físicas e jurídicas com vínculos no condomínio',
    tipoPessoa: 'ANY',
    escopoPapel: 'qualquer',
    codigosPapel: [],
    abasDetalhe: ['dados', 'foto', 'contatos', 'enderecos', 'vinculos', 'autorizacoes'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos([], []),
    inclusao: null,
  }),
  ctx({
    id: 'prestador-unidade',
    routeLista: '/prestadores-unidade',
    routeDetalhe: '/prestadores-unidade/:idPessoa',
    routeNovo: '/prestadores-unidade/novo',
    permissionKey: 'PRESTADORESUNIDADE',
    tituloLista: 'Prestadores (unidade)',
    subtituloLista: 'Prestadores vinculados a uma unidade',
    tipoPessoa: 'PF',
    escopoPapel: 'unidade',
    codigosPapel: [PapelVinculoCodigo.prestadorUnidade],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'enderecos'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoUnidade),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.prestadorUnidade, documento: 'cpf' },
  }),
  ctx({
    id: 'ocupante-proprietario',
    routeLista: '/ocupantes-proprietarios',
    routeDetalhe: '/ocupantes-proprietarios/:idPessoa',
    routeNovo: '/ocupantes-proprietarios/novo',
    permissionKey: 'OCUPANTESPROPRIETARIOS',
    tituloLista: 'Ocupantes e Proprietários',
    subtituloLista: 'Proprietários, locatários, dependentes e vínculo de morador na unidade',
    tipoPessoa: 'PF_OU_PJ',
    escopoPapel: 'unidade',
    codigosPapel: [
      PapelVinculoCodigo.proprietario,
      PapelVinculoCodigo.morador,
      PapelVinculoCodigo.locatario,
      PapelVinculoCodigo.dependenteUnidade,
    ],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'enderecos'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPjOuPf, vinculoUnidade),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.proprietario, documento: 'cpf_ou_cnpj' },
  }),
  ctx({
    id: 'visitante',
    routeLista: '/visitantes',
    routeDetalhe: '/visitantes/:idPessoa',
    routeNovo: '/visitantes/novo',
    permissionKey: 'VISITANTES',
    tituloLista: 'Visitantes',
    subtituloLista: 'Visitantes com vínculo na unidade; acessos pontuais também usam autorizações',
    tipoPessoa: 'PF',
    escopoPapel: 'unidade',
    codigosPapel: [PapelVinculoCodigo.visitante],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'autorizacoes'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoUnidade),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.visitante, documento: 'cpf' },
  }),
  ctx({
    id: 'representante-legal',
    routeLista: '/representantes-legais',
    routeDetalhe: '/representantes-legais/:idPessoa',
    routeNovo: '/representantes-legais/novo',
    permissionKey: 'REPRESENTANTESLEGAIS',
    tituloLista: 'Representantes legais',
    subtituloLista: 'Pessoa física que representa outra pessoa',
    tipoPessoa: 'PF',
    escopoPapel: 'pessoa',
    codigosPapel: [PapelVinculoCodigo.representanteLegal],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoPessoa),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.representanteLegal, documento: 'cpf' },
  }),
  ctx({
    id: 'prestador-condominio',
    routeLista: '/prestadores',
    routeDetalhe: '/prestadores/:idPessoa',
    routeNovo: '/prestadores/novo',
    permissionKey: 'PRESTADORES',
    tituloLista: 'Prestadores (condomínio)',
    subtituloLista: 'Prestadores vinculados ao condomínio',
    tipoPessoa: 'PF',
    escopoPapel: 'condominio',
    codigosPapel: [PapelVinculoCodigo.prestadorCondominio],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'enderecos'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoCondominio),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.prestadorCondominio, documento: 'cpf' },
  }),
  ctx({
    id: 'fornecedor',
    routeLista: '/fornecedores',
    routeDetalhe: '/fornecedores/:idPessoa',
    routeNovo: '/fornecedores/novo',
    permissionKey: 'FORNECEDORES',
    tituloLista: 'Fornecedores',
    subtituloLista: 'Pessoas físicas ou jurídicas fornecedoras do condomínio',
    tipoPessoa: 'PF_OU_PJ',
    escopoPapel: 'condominio',
    codigosPapel: [PapelVinculoCodigo.fornecedor],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'enderecos'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPjOuPf, vinculoCondominio),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.fornecedor, documento: 'cpf_ou_cnpj' },
  }),
  ctx({
    id: 'gestores',
    routeLista: '/gestores',
    routeDetalhe: '/gestores/:idPessoa',
    routeNovo: '/gestores/novo',
    permissionKey: 'GESTORES',
    tituloLista: 'Gestores',
    subtituloLista: 'Síndicos, subsíndicos, conselheiros e administradoras do condomínio',
    tipoPessoa: 'PF',
    escopoPapel: 'condominio',
    codigosPapel: [
      PapelVinculoCodigo.sindico,
      PapelVinculoCodigo.subsindico,
      PapelVinculoCodigo.conselheiro,
      PapelVinculoCodigo.administradora,
    ],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoCondominio),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.sindico, documento: 'cpf' },
  }),
  ctx({
    id: 'colaborador',
    routeLista: '/colaboradores',
    routeDetalhe: '/colaboradores/:idPessoa',
    routeNovo: '/colaboradores/novo',
    permissionKey: 'COLABORADORES',
    tituloLista: 'Colaboradores',
    subtituloLista: 'Funcionários e terceirizados do condomínio',
    tipoPessoa: 'PF',
    escopoPapel: 'condominio',
    codigosPapel: [PapelVinculoCodigo.funcionario, PapelVinculoCodigo.terceirizado],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'enderecos'],
    vinculoContexto: { tiposDado: ['colaborador'] },
    camposObrigatorios: campos(pessoaPf, vinculoCondominio, colaboradorObrigatorio),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.funcionario, documento: 'cpf', tipoColaborador: 1 },
  }),
  ctx({
    id: 'entregador',
    routeLista: '/entregadores',
    routeDetalhe: '/entregadores/:idPessoa',
    routeNovo: '/entregadores/novo',
    permissionKey: 'ENTREGADORES',
    tituloLista: 'Entregadores',
    subtituloLista: 'Entregadores do condomínio; entregas pontuais também usam autorizações',
    tipoPessoa: 'PF',
    escopoPapel: 'condominio',
    codigosPapel: [PapelVinculoCodigo.entregador],
    abasDetalhe: ['dados', 'foto', 'contatos', 'vinculoContexto', 'autorizacoes'],
    vinculoContexto: { tiposDado: [] },
    camposObrigatorios: campos(pessoaPf, vinculoCondominio),
    inclusao: { codigoPapelPadrao: PapelVinculoCodigo.entregador, documento: 'cpf' },
  }),
];

const porId = new Map(PESSOA_CONTEXTOS.map(c => [c.id, c]));

export function pessoaContextoPorId(id: string | null | undefined): PessoaContextoConfig {
  return porId.get(id || 'pessoas') ?? porId.get('pessoas')!;
}

export function contextosDeMenu(): PessoaContextoConfig[] {
  return PESSOA_CONTEXTOS.filter(c => c.id !== 'pessoas');
}

export const CHAVES_PERMISSAO_COLABORADOR = ['COLABORADORES', 'FUNCIONARIOS', 'TERCEIRIZADOS'] as const;

export function ehContextoColaborador(id: string | null | undefined): boolean {
  return id === 'colaborador';
}

export const CHAVES_PERMISSAO_OCUPANTE = [
  'OCUPANTESPROPRIETARIOS',
  'MORADORES',
  'PROPRIETARIOS',
  'LOCATARIOS',
] as const;

export function ehContextoOcupante(id: string | null | undefined): boolean {
  return id === 'ocupante-proprietario';
}

export const CHAVES_PERMISSAO_GESTOR = [
  'GESTORES',
  'SINDICOS',
  'SUBSINDICOS',
  'CONSELHEIROS',
  'ADMINISTRADORAS',
] as const;

export function ehContextoGestor(id: string | null | undefined): boolean {
  return id === 'gestores';
}

export function rotuloTipoOcupacao(codigoPapel?: number | null, papelResumo?: string | null): string {
  if (codigoPapel === PapelVinculoCodigo.proprietario) return 'Proprietário';
  if (codigoPapel === PapelVinculoCodigo.locatario) return 'Locatário';
  if (codigoPapel === PapelVinculoCodigo.dependenteUnidade) return 'Dependente';
  const p = (papelResumo ?? '').toLowerCase();
  if (p.includes('propriet')) return 'Proprietário';
  if (p.includes('locat')) return 'Locatário';
  if (p.includes('depend')) return 'Dependente';
  return papelResumo ?? '—';
}

export function rotuloTipoGestor(codigoPapel?: number | null, papelResumo?: string | null): string {
  if (codigoPapel === PapelVinculoCodigo.sindico) return 'Síndico';
  if (codigoPapel === PapelVinculoCodigo.subsindico) return 'Subsíndico';
  if (codigoPapel === PapelVinculoCodigo.conselheiro) return 'Conselheiro';
  if (codigoPapel === PapelVinculoCodigo.administradora) return 'Administração';
  const p = (papelResumo ?? '').toLowerCase();
  if (p.includes('subsínd') || p.includes('subsind')) return 'Subsíndico';
  if (p.includes('sínd') || p.includes('sind')) return 'Síndico';
  if (p.includes('conselh')) return 'Conselheiro';
  if (p.includes('administr')) return 'Administração';
  return papelResumo ?? '—';
}

export function rotuloTipoColaborador(codigoPapel?: number | null, papelResumo?: string | null): string {
  if (codigoPapel === PapelVinculoCodigo.terceirizado) return 'Terceirizado';
  if (codigoPapel === PapelVinculoCodigo.funcionario) return 'Funcionário';
  const p = (papelResumo ?? '').toLowerCase();
  if (p.includes('terceiriz')) return 'Terceirizado';
  if (p.includes('funcion')) return 'Funcionário';
  return papelResumo ?? '—';
}
