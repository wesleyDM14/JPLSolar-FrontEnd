import { FaExclamationTriangle, FaInfoCircle, FaMoneyBillWave, FaQuestionCircle } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import { FUSO_HORARIO, isoBr } from './datas';

// Apresentação de cada tipo de notificação: ícone, cor, rótulo e para onde levar o usuário.
const TIPOS = {
    USINA_ALERTA: { icon: FaExclamationTriangle, tom: 'red', rotulo: 'Defeito', grupo: 'usinas' },
    USINA_OFFLINE: { icon: MdWifiOff, tom: 'orange', rotulo: 'Offline', grupo: 'usinas' },
    PAGAMENTO_RECEBIDO: { icon: FaMoneyBillWave, tom: 'green', rotulo: 'Recebimento', grupo: 'financeiro' },
    PAGAMENTO_NAO_IDENTIFICADO: { icon: FaQuestionCircle, tom: 'purple', rotulo: 'Conferir', grupo: 'financeiro' },
    SISTEMA: { icon: FaInfoCircle, tom: 'blue', rotulo: 'Sistema', grupo: 'sistema' },
};

export function infoNotificacao(notificacao) {
    return TIPOS[notificacao.tipo] ?? TIPOS.SISTEMA;
}

/** Caminho da tela relacionada ao aviso (ou null quando não há). */
export function destinoNotificacao(notificacao) {
    if (notificacao.plant?.id) return `/usinas/${notificacao.plant.id}`;
    if (notificacao.lancamentoId) return `/financeiro/receber?lancamento=${notificacao.lancamentoId}`;
    if (notificacao.tipo === 'PAGAMENTO_RECEBIDO' || notificacao.tipo === 'PAGAMENTO_NAO_IDENTIFICADO') return '/financeiro/receber';
    return null;
}

/** "Hoje", "Ontem" ou a data, para agrupar a lista por dia. */
export function rotuloDoDia(valor, agora = new Date()) {
    const data = new Date(valor);
    const dia = (instante) => Date.parse(`${isoBr(instante)}T00:00:00.000Z`);
    const diferenca = Math.round((dia(agora) - dia(data)) / 86400000);

    if (diferenca <= 0) return 'Hoje';
    if (diferenca === 1) return 'Ontem';
    if (diferenca < 7) return data.toLocaleDateString('pt-BR', { timeZone: FUSO_HORARIO, weekday: 'long' });
    return data.toLocaleDateString('pt-BR', { timeZone: FUSO_HORARIO, day: '2-digit', month: 'long', year: 'numeric' });
}

export const horaCurta = (valor) => new Date(valor).toLocaleTimeString('pt-BR', { timeZone: FUSO_HORARIO, hour: '2-digit', minute: '2-digit' });
