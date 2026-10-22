import { formatCurrency } from '../../utils/masks';

export const brl = formatCurrency;
export const horasTexto = (horas) => `${Number(horas || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`;

// Situação da cobrança de um serviço (a API devolve ATRASADO quando já passou do vencimento sem quitar).
export const COBRANCA = {
    PAGO: { label: 'Pago', tone: 'success' },
    PARCIAL: { label: 'Pago em parte', tone: 'warning' },
    ABERTO: { label: 'Em aberto', tone: 'info' },
    ATRASADO: { label: 'Atrasado', tone: 'danger' },
    CANCELADA: { label: 'Cancelado', tone: 'neutral' },
    CANCELADO: { label: 'Cancelado', tone: 'neutral' },
};

// Situação do cliente na cobrança do munck.
export const SITUACAO_CLIENTE = {
    QUITADO: { label: 'Pagou tudo', tone: 'success' },
    DEVENDO: { label: 'Devendo (no prazo)', tone: 'info' },
    ATRASADO: { label: 'Devendo (atrasado)', tone: 'danger' },
};

export const NOTA = {
    AUTORIZADA: { label: 'Nota emitida', tone: 'success' },
    PENDENTE: { label: 'Nota em processamento', tone: 'warning' },
    REJEITADA: { label: 'Nota rejeitada', tone: 'danger' },
    CANCELADA: { label: 'Nota cancelada', tone: 'neutral' },
};

/** Estado da nota de um serviço: sem nota, a emitir, ou o status da nota existente. */
export function notaInfo(servico) {
    if (servico.nota) return { ...(NOTA[servico.nota.status] ?? { label: servico.nota.status, tone: 'neutral' }), numero: servico.nota.numero };
    return servico.emiteNota ? { label: 'Nota a emitir', tone: 'warning' } : { label: 'Sem nota', tone: 'neutral' };
}

/** Pode entrar numa emissão: marcado para ter nota e sem nota viva (autorizada ou em processamento). */
export const podeEmitirNota = (servico) =>
    servico.status === 'REGISTRADA' && servico.emiteNota && (!servico.nota || servico.nota.status === 'REJEITADA' || servico.nota.status === 'CANCELADA');

export const SITUACOES_FILTRO = [
    { value: 'EM_ABERTO', label: 'Em aberto' },
    { value: 'ATRASADO', label: 'Atrasados' },
    { value: 'PAGO', label: 'Pagos' },
];

export const NOTAS_FILTRO = [
    { value: 'A_EMITIR', label: 'Nota a emitir' },
    { value: 'EMITIDA', label: 'Nota emitida' },
    { value: 'SEM_NOTA', label: 'Sem nota' },
];

export const mesLabel = (chave) => {
    const [ano, mes] = chave.split('-');
    return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(mes) - 1]}/${ano.slice(2)}`;
};
