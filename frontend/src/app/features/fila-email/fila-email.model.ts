export interface EmailQueueListItem {
  id: number;
  destinatario: string;
  assunto: string;
  status: string;
  tentativas: number;
  ultimaTentativa?: string | null;
  mensagemErro?: string | null;
  dataCriacao: string;
  dataEnvio?: string | null;
}

export interface EmailQueueDetalhe extends EmailQueueListItem {
  corpoPreview?: string | null;
}

export interface EmailQueueFiltros {
  status?: string | null;
  destinatario?: string;
  assunto?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface EmailQueueReprocessarResultado {
  ok: boolean;
  mensagem: string;
  item?: EmailQueueListItem | null;
}

export function labelStatusEmailQueue(status: string): string {
  switch (status) {
    case 'Enviando': return 'Processando';
    case 'Erro': return 'Falha';
    default: return status;
  }
}