export interface ConfiguracaoEmail {
  id: number;
  provedor: string;
  servidorSmtp: string;
  porta: number;
  ssl: boolean;
  startTls: boolean;
  timeoutSegundos: number;
  usuarioSmtp: string;
  senhaConfigurada: boolean;
  senhaRequerAtualizacao: boolean;
  nomeRemetente: string;
  emailRemetente: string;
  replyTo?: string | null;
  dataCadastro?: string;
  dataAtualizacao?: string | null;
  ativo: boolean;
}

export interface ConfiguracaoEmailUpsert {
  provedor: string;
  servidorSmtp: string;
  porta: number;
  ssl: boolean;
  startTls: boolean;
  timeoutSegundos: number;
  usuarioSmtp: string;
  senha?: string | null;
  nomeRemetente: string;
  emailRemetente: string;
  replyTo?: string | null;
  ativo: boolean;
}

export interface EmailTesteConexaoResultado {
  sucesso: boolean;
  mensagem: string;
  duracaoMs: number;
}

export interface EmailTesteEnvioResultado {
  sucesso: boolean;
  mensagem: string;
  duracaoMs: number;
}