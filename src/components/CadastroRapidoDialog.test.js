import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CadastroRapidoDialog from './CadastroRapidoDialog';
import { clientesApi, financeiroApi } from '../api/resources';

jest.mock('../api/resources', () => ({
    clientesApi: { create: jest.fn() },
    financeiroApi: { createFornecedor: jest.fn() },
}));
// O cliente HTTP (axios, em módulo ES) não é carregado nos testes de tela.
jest.mock('../api/client', () => ({ errorMessage: (_erro, padrao) => padrao ?? 'erro', fieldErrors: () => ({}) }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

// O formulário de uma conta a pagar/receber: o cadastro rápido abre POR CIMA dele e não pode enviá-lo junto.
function Tela({ parte, aoCriar, aoEnviarConta }) {
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
        <QueryClientProvider client={cliente}>
            <form onSubmit={(e) => { e.preventDefault(); aoEnviarConta(); }}>
                <input aria-label="descricao" defaultValue="Instalação" />
                <CadastroRapidoDialog open parte={parte} nomeInicial="Maria" onClose={() => {}} onCriado={aoCriar} />
            </form>
        </QueryClientProvider>
    );
}

describe('cadastro rápido de cliente/fornecedor', () => {
    beforeEach(() => jest.clearAllMocks());

    it('cadastra o cliente com o nome digitado e devolve o criado, sem enviar a conta de baixo', async () => {
        clientesApi.create.mockResolvedValue({ id: 'c1', nome: 'Maria da Silva' });
        const aoCriar = jest.fn();
        const aoEnviarConta = jest.fn();
        render(<Tela parte="cliente" aoCriar={aoCriar} aoEnviarConta={aoEnviarConta} />);

        const nome = screen.getByLabelText(/Nome ou razão social/);
        expect(nome.value).toBe('Maria'); // já vem com o que foi digitado na busca
        fireEvent.change(nome, { target: { value: 'Maria da Silva' } });
        fireEvent.click(screen.getByText('Cadastrar e usar'));

        await waitFor(() => expect(aoCriar).toHaveBeenCalledWith({ id: 'c1', nome: 'Maria da Silva' }));
        expect(clientesApi.create).toHaveBeenCalledWith(expect.objectContaining({ tipoPessoa: 'PESSOA_FISICA', nome: 'Maria da Silva' }));
        expect(aoEnviarConta).not.toHaveBeenCalled();
    });

    it('cadastra o fornecedor (sem tipo de pessoa)', async () => {
        financeiroApi.createFornecedor.mockResolvedValue({ id: 'f1', nome: 'Distribuidora Sol' });
        const aoCriar = jest.fn();
        render(<Tela parte="fornecedor" aoCriar={aoCriar} aoEnviarConta={jest.fn()} />);

        expect(screen.queryByLabelText('Tipo de pessoa')).toBeNull();
        fireEvent.change(screen.getByLabelText(/Nome do fornecedor/), { target: { value: 'Distribuidora Sol' } });
        fireEvent.click(screen.getByText('Cadastrar e usar'));

        await waitFor(() => expect(aoCriar).toHaveBeenCalledWith({ id: 'f1', nome: 'Distribuidora Sol' }));
        expect(financeiroApi.createFornecedor).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Distribuidora Sol' }));
    });

    it('exige o nome antes de cadastrar', async () => {
        const aoCriar = jest.fn();
        render(<Tela parte="cliente" aoCriar={aoCriar} aoEnviarConta={jest.fn()} />);
        fireEvent.change(screen.getByLabelText(/Nome ou razão social/), { target: { value: '   ' } });
        fireEvent.click(screen.getByText('Cadastrar e usar'));

        expect(await screen.findByText('Informe o nome')).toBeTruthy();
        expect(clientesApi.create).not.toHaveBeenCalled();
        expect(aoCriar).not.toHaveBeenCalled();
    });
});
