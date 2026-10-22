import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { muckApi } from '../../api/resources';
import NotasDialog from './NotasDialog';
import { horasEntre } from './ServicoDialog';

jest.mock('../../api/resources', () => ({
    muckApi: { revisarNotas: jest.fn(), emitirNotas: jest.fn(), espelho: jest.fn(), veiculos: jest.fn(), motoristas: jest.fn() },
    openFileInTab: jest.fn(),
}));
// O cliente HTTP (axios, em módulo ES) não é carregado nos testes de tela.
jest.mock('../../api/client', () => ({ errorMessage: (erro) => erro?.message ?? 'erro', fieldErrors: () => ({}) }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../../components/ParteField', () => () => null);

const revisao = {
    itens: [
        { operacaoId: 'a', data: '2026-10-20T00:00:00.000Z', cliente: 'Cliente A', destino: 'Mossoró', horas: 4.5, valor: 1125, discriminacao: 'Serviço', pronto: true, problemas: [] },
        { operacaoId: 'b', data: '2026-10-21T00:00:00.000Z', cliente: 'Cliente B', destino: 'Natal', horas: 2, valor: 500, discriminacao: 'Serviço', pronto: false, problemas: ['O cliente não tem CPF/CNPJ cadastrado.'] },
    ],
    quantidadeProntos: 1,
    totalProntos: 1125,
    ambiente: 'PRODUCAO',
};

function Tela() {
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
        <QueryClientProvider client={cliente}>
            <NotasDialog open ids={['a', 'b']} onClose={() => {}} />
        </QueryClientProvider>
    );
}

describe('emissão de notas do munck', () => {
    beforeEach(() => jest.clearAllMocks());

    it('não emite nada ao abrir nem ao passar pela revisão; só depois do aceite e do clique de confirmação', async () => {
        muckApi.revisarNotas.mockResolvedValue(revisao);
        muckApi.emitirNotas.mockResolvedValue({ emitidas: 1, resultados: [{ operacaoId: 'a', cliente: 'Cliente A', resultado: 'EMITIDA', numero: '55', notaId: 'n', mensagens: [] }] });
        render(<Tela />);

        // Revisão: mostra o problema do serviço sem CPF/CNPJ e oferece o espelho do que está pronto.
        expect(await screen.findByText('Cliente A')).toBeTruthy();
        expect(screen.getByText('O cliente não tem CPF/CNPJ cadastrado.', { exact: false })).toBeTruthy();
        expect(screen.getAllByText('Ver espelho')).toHaveLength(1);
        expect(muckApi.emitirNotas).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText(/Continuar \(1 nota\)/));

        // Confirmação: o botão de emitir fica travado até o aceite explícito.
        const botao = screen.getByText(/Emitir 1 nota/).closest('button');
        expect(botao.disabled).toBe(true);
        fireEvent.click(botao);
        expect(muckApi.emitirNotas).not.toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText(/Conferi os espelhos/));
        expect(botao.disabled).toBe(false);
        fireEvent.click(botao);

        // Só os serviços prontos vão, com a quantidade e o total que o usuário viu.
        await waitFor(() => expect(muckApi.emitirNotas).toHaveBeenCalledTimes(1));
        expect(muckApi.emitirNotas.mock.calls[0][0]).toEqual({ ids: ['a'], confirmado: true, quantidadeConfirmada: 1, totalConfirmado: 1125 });
        expect(await screen.findByText(/NFS-e nº 55/)).toBeTruthy();
    });

    it('avisa que a emissão em produção vale fiscalmente', async () => {
        muckApi.revisarNotas.mockResolvedValue(revisao);
        render(<Tela />);
        await screen.findByText('Cliente A');
        fireEvent.click(screen.getByText(/Continuar/));
        expect(screen.getByText(/PRODUÇÃO/)).toBeTruthy();
    });
});

describe('horas entre dois horários', () => {
    it('calcula em horas decimais e recusa intervalos inválidos', () => {
        expect(horasEntre('08:00', '12:30')).toBe(4.5);
        expect(horasEntre('12:00', '08:00')).toBeNull();
        expect(horasEntre('', '10:00')).toBeNull();
    });
});
