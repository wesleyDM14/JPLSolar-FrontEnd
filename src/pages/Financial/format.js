import { formatCurrency } from '../../utils/masks';

export const brl = formatCurrency;

export const TIPO = { RECEBER: 'RECEBER', PAGAR: 'PAGAR' };

// Situação mostrada ao usuário (a API devolve ATRASADO quando aberto/parcial já venceu).
const SITUACOES = {
    ABERTO: { label: 'Em aberto', tone: 'info' },
    PARCIAL: { label: 'Parcial', tone: 'warning' },
    ATRASADO: { label: 'Vencido', tone: 'danger' },
    PAGO: { label: 'Pago', tone: 'success' },
    CANCELADO: { label: 'Cancelado', tone: 'neutral' },
};

export function situacaoInfo(situacao, tipo) {
    const base = SITUACOES[situacao] ?? SITUACOES.ABERTO;
    return situacao === 'PAGO' && tipo === TIPO.RECEBER ? { ...base, label: 'Recebido' } : base;
}

export const situacaoOptions = (tipo) => [
    { value: 'PENDENTE', label: 'Pendentes (em aberto + vencidos)' },
    { value: 'ABERTO', label: 'Em aberto (no prazo)' },
    { value: 'ATRASADO', label: 'Vencidos' },
    { value: 'PARCIAL', label: 'Parcialmente pagos' },
    { value: 'PAGO', label: tipo === TIPO.RECEBER ? 'Recebidos' : 'Pagos' },
    { value: 'CANCELADO', label: 'Cancelados' },
];

export const formaOptions = [
    { value: 'PIX', label: 'PIX' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'TRANSFERENCIA', label: 'Transferência' },
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'CARTAO', label: 'Cartão' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OUTRO', label: 'Outro' },
];

export const formaLabel = (forma) => formaOptions.find((option) => option.value === forma)?.label ?? forma;

export const agruparOptions = (tipo) => [
    { value: 'categoria', label: 'Categoria' },
    { value: tipo === TIPO.RECEBER ? 'cliente' : 'fornecedor', label: tipo === TIPO.RECEBER ? 'Cliente' : 'Fornecedor' },
    { value: 'mes', label: 'Mês de vencimento' },
    { value: 'conta', label: 'Conta' },
    { value: 'situacao', label: 'Situação' },
    { value: 'contrato', label: 'Contrato' },
];

export const mesLabel = (chave) => {
    if (!chave || !/^\d{4}-\d{2}$/.test(chave)) return chave;
    const [ano, mes] = chave.split('-');
    return `${mes}/${ano}`;
};

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const mesCurto = (chave) => {
    const [ano, mes] = chave.split('-');
    return `${MESES_CURTOS[Number(mes) - 1]}/${ano.slice(2)}`;
};

export const primeiroDiaDoMes = (chave) => `${chave}-01`;
export const ultimoDiaDoMes = (chave) => {
    const [ano, mes] = chave.split('-').map(Number);
    return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
};

export { hojeIso } from '../../utils/datas';

/** Descrição curta de quem paga/recebe. */
export const parteDe = (lancamento) => lancamento.cliente?.nome ?? lancamento.fornecedor?.nome ?? '';
