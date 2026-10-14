import {
    FaArrowDown,
    FaArrowUp,
    FaBalanceScale,
    FaBarcode,
    FaBook,
    FaChartLine,
    FaCog,
    FaExclamationTriangle,
    FaFileInvoiceDollar,
    FaTachometerAlt,
    FaUniversity,
    FaWater,
} from 'react-icons/fa';

// Estrutura do módulo financeiro: usada pelo menu lateral (submenu) e pela barra de navegação das telas.
export const FINANCEIRO_MENU = [
    { path: '/financeiro', rotulo: 'Visão geral', icon: FaTachometerAlt, exato: true },
    { path: '/financeiro/receber', rotulo: 'A receber', icon: FaArrowDown },
    { path: '/financeiro/boletos', rotulo: 'Boletos', icon: FaBarcode },
    { path: '/financeiro/pagar', rotulo: 'A pagar', icon: FaArrowUp },
    { path: '/financeiro/fluxo', rotulo: 'Fluxo de caixa', icon: FaWater },
    { path: '/financeiro/dre', rotulo: 'DRE', icon: FaBalanceScale },
    { path: '/financeiro/indicadores', rotulo: 'Indicadores', icon: FaChartLine },
    { path: '/financeiro/risco', rotulo: 'Clientes de risco', icon: FaExclamationTriangle },
    { path: '/financeiro/contabilidade', rotulo: 'Contabilidade', icon: FaBook },
    { path: '/financeiro/fiscal', rotulo: 'Notas fiscais', icon: FaFileInvoiceDollar },
    { path: '/financeiro/bancos', rotulo: 'Bancos', icon: FaUniversity },
    { path: '/financeiro/cadastros', rotulo: 'Cadastros', icon: FaCog },
];
