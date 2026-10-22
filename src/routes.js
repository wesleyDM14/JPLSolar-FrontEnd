import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import BasicRoute from './components/BasicRoute';
import AuthRoute from './components/AuthRoute';

import MainLayout from './layouts/MainLayout';

import Arquivos from './pages/Administracao/Arquivos';
import MuckPainel from './pages/Muck/Painel';
import MuckServicos from './pages/Muck/Servicos';
import MuckCobranca from './pages/Muck/Cobranca';
import MuckManutencao from './pages/Muck/Manutencao';
import MuckCadastros from './pages/Muck/Cadastros';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Financial, { CadastrosPagina, Pagar, Receber } from './pages/Financial';
import Bancos from './pages/Financial/Bancos';
import Boletos from './pages/Financial/Boletos';
import ClientesRisco from './pages/Financial/ClientesRisco';
import Contabilidade from './pages/Financial/Contabilidade';
import Dre from './pages/Financial/Dre';
import FiscalConfig from './pages/Financial/fiscal/FiscalConfig';
import Atividades from './pages/Financial/fiscal/Atividades';
import Notas from './pages/Financial/fiscal/Notas';
import FluxoCaixa from './pages/Financial/FluxoCaixa';
import Indicadores from './pages/Financial/Indicadores';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import NotAuthorized from './pages/NotAuthorized/index.js';

import Clientes from './pages/Clientes';
import ClienteFormPage from './pages/Clientes/ClienteFormPage';
import ClienteDetail from './pages/Clientes/ClienteDetail';
import Usinas from './pages/Usinas';
import UsinaFormPage from './pages/Usinas/UsinaFormPage';
import UsinaDetail from './pages/Usinas/UsinaDetail';
import Equipe from './pages/Equipe';
import Servicos from './pages/Servicos';
import ServicoDetail from './pages/Servicos/ServicoDetail';
import ModelosServico from './pages/Servicos/Modelos';
import Contratos from './pages/Contratos';
import ContratoFormPage from './pages/Contratos/ContratoFormPage';
import ContratoDetail from './pages/Contratos/ContratoDetail';

// Todas as telas internas exigem login e usam o layout principal.
const Protected = ({ children }) => (
    <AuthRoute>
        <MainLayout>{children}</MainLayout>
    </AuthRoute>
);

export const AppRoutes = () => (
    <Routes>
        <Route path='/' element={<BasicRoute><Home /></BasicRoute>} />
        <Route path='/dashboard' element={<Protected><Dashboard /></Protected>} />

        <Route path='/clientes' element={<Protected><Clientes /></Protected>} />
        <Route path='/clientes/novo' element={<Protected><ClienteFormPage /></Protected>} />
        <Route path='/clientes/:id' element={<Protected><ClienteDetail /></Protected>} />
        <Route path='/clientes/:id/editar' element={<Protected><ClienteFormPage /></Protected>} />

        <Route path='/usinas' element={<Protected><Usinas /></Protected>} />
        <Route path='/usinas/nova' element={<Protected><UsinaFormPage /></Protected>} />
        <Route path='/usinas/:id' element={<Protected><UsinaDetail /></Protected>} />
        <Route path='/usinas/:id/editar' element={<Protected><UsinaFormPage /></Protected>} />

        <Route path='/contratos' element={<Protected><Contratos /></Protected>} />
        <Route path='/contratos/novo' element={<Protected><ContratoFormPage /></Protected>} />
        <Route path='/contratos/:id' element={<Protected><ContratoDetail /></Protected>} />
        <Route path='/contratos/:id/editar' element={<Protected><ContratoFormPage /></Protected>} />

        <Route path='/servicos' element={<Protected><Servicos /></Protected>} />
        <Route path='/servicos/modelos' element={<Protected><ModelosServico /></Protected>} />
        <Route path='/servicos/:id' element={<Protected><ServicoDetail /></Protected>} />
        <Route path='/equipe' element={<Protected><Equipe /></Protected>} />

        <Route path='/muck' element={<Protected><MuckPainel /></Protected>} />
        <Route path='/muck/servicos' element={<Protected><MuckServicos /></Protected>} />
        <Route path='/muck/cobranca' element={<Protected><MuckCobranca /></Protected>} />
        <Route path='/muck/manutencao' element={<Protected><MuckManutencao /></Protected>} />
        <Route path='/muck/cadastros' element={<Protected><MuckCadastros /></Protected>} />
        <Route path='/financeiro' element={<Protected><Financial /></Protected>} />
        <Route path='/financeiro/receber' element={<Protected><Receber /></Protected>} />
        <Route path='/financeiro/boletos' element={<Protected><Boletos /></Protected>} />
        <Route path='/financeiro/pagar' element={<Protected><Pagar /></Protected>} />
        <Route path='/financeiro/fluxo' element={<Protected><FluxoCaixa /></Protected>} />
        <Route path='/financeiro/dre' element={<Protected><Dre /></Protected>} />
        <Route path='/financeiro/indicadores' element={<Protected><Indicadores /></Protected>} />
        <Route path='/financeiro/risco' element={<Protected><ClientesRisco /></Protected>} />
        <Route path='/financeiro/contabilidade' element={<Protected><Contabilidade /></Protected>} />
        <Route path='/financeiro/fiscal' element={<Protected><Notas /></Protected>} />
        <Route path='/financeiro/fiscal/configuracao' element={<Protected><FiscalConfig /></Protected>} />
        <Route path='/financeiro/fiscal/atividades' element={<Protected><Atividades /></Protected>} />
        <Route path='/financeiro/bancos' element={<Protected><Bancos /></Protected>} />
        <Route path='/financeiro/cadastros' element={<Protected><CadastrosPagina /></Protected>} />
        <Route path='/relatorios' element={<Protected><Reports /></Protected>} />
        <Route path='/tarefas' element={<Protected><Tasks /></Protected>} />
        <Route path='/notificacoes' element={<Protected><Notifications /></Protected>} />
        <Route path='/administracao' element={<Navigate to='/administracao/arquivos' replace />} />
        <Route path='/administracao/arquivos' element={<Protected><Arquivos /></Protected>} />
        <Route path='/perfil' element={<Protected><Profile /></Protected>} />
        <Route path='/not-authorized' element={<NotAuthorized />} />
    </Routes>
);
