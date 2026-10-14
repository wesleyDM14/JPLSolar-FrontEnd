/* eslint-disable testing-library/no-node-access -- o painel desenha cada letra como <span>; a verificação lê o aria-label dos contêineres */
import { act, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './index';

// O axios é ESM e não é necessário aqui: a API é toda simulada.
jest.mock('../../api/client', () => ({ errorMessage: (error) => String(error?.message ?? error) }));

jest.mock('../../api/resources', () => ({
    dashboardApi: { get: jest.fn() },
}));

const { dashboardApi } = require('../../api/resources');

// 3 usinas com problema (offline/alerta/sem leitura) e 20 operando.
const usinas = [
    { id: 'p1', code: 'DEF-001', status: 'OFFLINE', cliente: 'Cliente Offline', inversor: 'GROWATT', eTotal: 100 },
    { id: 'p2', code: 'DEF-002', status: 'ALERTA', cliente: 'Cliente Alerta', inversor: 'DEYE', eTotal: 200 },
    { id: 'p3', code: 'DEF-003', status: 'SEM_LEITURA', cliente: 'Cliente Sem Leitura', inversor: 'SOLIS', eTotal: null },
    ...Array.from({ length: 20 }, (_, i) => ({
        id: `ok${i + 1}`,
        code: `OK-${String(i + 1).padStart(3, '0')}`,
        status: 'ONLINE',
        cliente: `Cliente OK ${i + 1}`,
        inversor: 'GROWATT',
        eTotal: 1000 + i,
    })),
];

// Cada letra é uma "aleta" (um <span>); o texto completo fica no aria-label do contêiner.
const labelsIn = (container) => [...container.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label'));

function renderDashboard() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

jest.setTimeout(30000);

describe('Painel de usinas (quadro de embarque)', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        dashboardApi.get.mockResolvedValue({ totalUsinas: usinas.length, potenciaInstaladaKwp: 123.4, usinas });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    const sectionOf = (title) => screen.getByText(new RegExp(title)).closest('section');

    it('mantém fixas as usinas com problema e mostra só um grupo das que estão OK', async () => {
        renderDashboard();

        const atencao = await screen.findByText(/REQUER ATENÇÃO/);
        expect(atencao.textContent).toContain('3');

        const fixas = labelsIn(sectionOf('REQUER ATENÇÃO'));
        expect(fixas).toEqual(expect.arrayContaining(['DEF-001', 'DEF-002', 'DEF-003']));

        // Apenas 8 das 20 usinas OK aparecem por vez.
        const operando = within(sectionOf('OPERANDO NORMALMENTE'));
        expect(operando.getAllByTitle(/Abrir usina/)).toHaveLength(8);
        expect(screen.getByText(/GRUPO 1\/3/)).toBeInTheDocument();
    });

    it('rotaciona as usinas OK a cada troca, sem mexer nas que têm problema', async () => {
        renderDashboard();
        await screen.findByText(/REQUER ATENÇÃO/);

        const okAntes = labelsIn(sectionOf('OPERANDO NORMALMENTE')).filter((l) => l.startsWith('OK-'));
        const fixasAntes = labelsIn(sectionOf('REQUER ATENÇÃO')).filter((l) => l.startsWith('DEF-'));

        expect(okAntes[0]).toBe('OK-001');

        await act(async () => {
            jest.advanceTimersByTime(7000);
        });

        const okDepois = labelsIn(sectionOf('OPERANDO NORMALMENTE')).filter((l) => l.startsWith('OK-'));
        const fixasDepois = labelsIn(sectionOf('REQUER ATENÇÃO')).filter((l) => l.startsWith('DEF-'));

        expect(okDepois[0]).toBe('OK-009'); // próximo grupo de 8
        expect(okDepois).not.toEqual(okAntes);
        expect(fixasDepois).toEqual(fixasAntes);
        expect(screen.getByText(/GRUPO 2\/3/)).toBeInTheDocument();
    });

    it('volta ao primeiro grupo depois do último', async () => {
        renderDashboard();
        await screen.findByText(/REQUER ATENÇÃO/);

        await act(async () => {
            jest.advanceTimersByTime(7000 * 3);
        });

        const ok = labelsIn(sectionOf('OPERANDO NORMALMENTE')).filter((l) => l.startsWith('OK-'));
        expect(ok[0]).toBe('OK-001');
    });

    it('separa defeito (alerta) de offline nos contadores', async () => {
        dashboardApi.get.mockResolvedValue({
            totalUsinas: usinas.length,
            potenciaInstaladaKwp: 1,
            porStatus: { ONLINE: 20, STANDBY: 0, OFFLINE: 1, ALERTA: 1, SEM_LEITURA: 1 },
            usinas,
        });

        renderDashboard();
        await screen.findByText(/REQUER ATENÇÃO/);

        expect(screen.getByText('ALERTA').parentElement.textContent).toContain('1');
        expect(screen.getByText('OFFLINE').parentElement.textContent).toContain('1');
    });

    it('exibe aviso quando nenhuma usina tem problema', async () => {
        dashboardApi.get.mockResolvedValue({
            totalUsinas: 2,
            potenciaInstaladaKwp: 10,
            usinas: usinas.filter((u) => u.status === 'ONLINE').slice(0, 2),
        });

        renderDashboard();

        expect(await screen.findByText(/TODAS AS USINAS OPERANDO NORMALMENTE/)).toBeInTheDocument();
    });
});
