import { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaCog, FaMoneyBillWave } from 'react-icons/fa';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Page, PageHeader } from '../../ui';
import Cadastros from './Cadastros';
import LancamentoDialog from './LancamentoDialog';
import Lancamentos from './Lancamentos';
import VisaoGeral from './VisaoGeral';

// Links antigos usavam /financeiro?aba=...; agora cada área tem sua rota.
const ROTAS_ANTIGAS = { receber: 'receber', pagar: 'pagar', cadastros: 'cadastros', integracao: 'bancos' };

/** Visão geral do financeiro. */
export default function Financial() {
    const [params] = useSearchParams();
    const [detalheId, setDetalheId] = useState(null);
    const aba = params.get('aba');

    if (aba && ROTAS_ANTIGAS[aba]) {
        const resto = new URLSearchParams(params);
        resto.delete('aba');
        const consulta = resto.toString();
        return <Navigate to={`/financeiro/${ROTAS_ANTIGAS[aba]}${consulta ? `?${consulta}` : ''}`} replace />;
    }

    return (
        <Page>
            <PageHeader icon={FaMoneyBillWave} tone="green" title="Financeiro" subtitle="Contas a receber e a pagar, caixa e resultado." />
            <VisaoGeral onOpenLancamento={setDetalheId} />
            {detalheId && <LancamentoDialog id={detalheId} onClose={() => setDetalheId(null)} />}
        </Page>
    );
}

function filtrosDaUrl(params) {
    const campos = ['clienteId', 'clienteNome', 'fornecedorId', 'fornecedorNome', 'contratoId', 'boleto', 'categoriaId', 'contaId'];
    const filtros = Object.fromEntries(campos.filter((campo) => params.get(campo)).map((campo) => [campo, params.get(campo)]));
    if (params.has('situacao')) filtros.situacao = params.get('situacao');
    return filtros;
}

function ListaDeLancamentos({ tipo }) {
    const [params, setParams] = useSearchParams();
    const lancamento = params.get('lancamento');
    const receber = tipo === 'RECEBER';

    return (
        <Page>
            <PageHeader
                icon={receber ? FaArrowDown : FaArrowUp}
                tone={receber ? 'green' : 'red'}
                title={receber ? 'Contas a receber' : 'Contas a pagar'}
                subtitle={receber ? 'Parcelas de contratos e outras receitas.' : 'Despesas e compromissos com fornecedores.'}
            />
            <Lancamentos key={`${tipo}-${params.toString()}`} tipo={tipo} inicial={filtrosDaUrl(params)} />
            {lancamento && (
                <LancamentoDialog
                    id={lancamento}
                    onClose={() => {
                        const resto = new URLSearchParams(params);
                        resto.delete('lancamento');
                        setParams(resto, { replace: true });
                    }}
                />
            )}
        </Page>
    );
}

export const Receber = () => <ListaDeLancamentos tipo="RECEBER" />;
export const Pagar = () => <ListaDeLancamentos tipo="PAGAR" />;

export function CadastrosPagina() {
    return (
        <Page>
            <PageHeader icon={FaCog} tone="gray" title="Cadastros do financeiro" subtitle="Contas, categorias e fornecedores." />
            <Cadastros />
        </Page>
    );
}
