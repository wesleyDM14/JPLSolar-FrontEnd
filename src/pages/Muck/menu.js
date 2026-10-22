import { FaChartLine, FaClipboardList, FaHandHoldingUsd, FaIdCard, FaWrench } from 'react-icons/fa';

// Seções do caminhão munck: usadas pelo menu lateral (submenu).
export const MUCK_MENU = [
    { path: '/muck', rotulo: 'Painel', icon: FaChartLine, exato: true },
    { path: '/muck/servicos', rotulo: 'Serviços', icon: FaClipboardList },
    { path: '/muck/cobranca', rotulo: 'Cobrança', icon: FaHandHoldingUsd },
    { path: '/muck/manutencao', rotulo: 'Manutenção', icon: FaWrench },
    { path: '/muck/cadastros', rotulo: 'Veículo e motoristas', icon: FaIdCard },
];
