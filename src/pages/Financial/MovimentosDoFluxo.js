import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FaTruck, FaUsers } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Button, Card, DataTable, ErrorBlock, FilterInput, FilterSelect, Muted, PaginationBar, Row, SectionTitle, tokens } from '../../ui';
import { formatDate } from '../../utils/masks';
import { brl, mesLabel } from './format';
import LancamentoDialog from './LancamentoDialog';

const { colors } = tokens;

const PAGE_SIZE = 25;

const Filtros = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    align-items: end;
    margin-bottom: 14px;
`;

const Destaques = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 16px;

    > section {
        margin-bottom: 0;
        min-width: 0;
    }
`;

const Linha = styled.button`
    display: block;
    width: 100%;
    padding: 6px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;

    .topo {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.9rem;
    }

    .barra {
        height: 5px;
        margin-top: 4px;
        border-radius: 3px;
        background: ${colors.neutralBg};
        overflow: hidden;
    }

    .barra > div {
        height: 100%;
        border-radius: 3px;
    }

    &:hover .topo strong {
        text-decoration: underline;
    }
`;

const PAPEL = { CLIENTE: { rotulo: 'Cliente', tom: 'success' }, FORNECEDOR: { rotulo: 'Fornecedor', tom: 'warning' } };

/** Os cinco que mais movimentaram: clientes nas entradas, fornecedores nas saídas. */
function Ranking({ titulo, icone, itens, cor, onEscolher }) {
    const maior = itens[0]?.valor ?? 0;

    return (
        <Card>
            <SectionTitle icon={icone} tom={cor === colors.success ? 'green' : 'orange'}>{titulo}</SectionTitle>
            {itens.length === 0 ? (
                <Muted>Sem movimentações nos filtros escolhidos.</Muted>
            ) : (
                itens.map((item) => (
                    <Linha key={item.nome} type="button" title="Filtrar a lista por este nome" onClick={() => onEscolher(item.nome)}>
                        <div className="topo"><strong>{item.nome}</strong><span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(item.valor)}</span></div>
                        <div className="barra"><div style={{ width: `${maior > 0 ? (item.valor / maior) * 100 : 0}%`, background: cor }} /></div>
                    </Linha>
                ))
            )}
        </Card>
    );
}

/**
 * Lista do fluxo de caixa por lançamento: mostra de quem é cada entrada e saída (cliente ou fornecedor).
 * "Realizado" são os pagamentos feitos no período; "Previsto" são os vencimentos.
 */
export default function MovimentosDoFluxo({ periodo, mes, onMes }) {
    const [natureza, setNatureza] = useState('REALIZADO');
    const [sentido, setSentido] = useState('');
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(1);
    const [aberto, setAberto] = useState(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'fluxo', 'movimentos', periodo],
        queryFn: () => financeiroApi.fluxoCaixaMovimentos(periodo),
    });

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return (data?.movimentos ?? []).filter((m) => (
            m.natureza === natureza
            && (!sentido || m.tipo === sentido)
            && (!mes || m.data.startsWith(mes))
            && (!termo || `${m.parte?.nome ?? ''} ${m.descricao} ${m.categoria ?? ''}`.toLowerCase().includes(termo))
        ));
    }, [data, natureza, sentido, mes, busca]);

    const ranking = (tipo) => {
        const soma = new Map();
        filtrados.filter((m) => m.tipo === tipo).forEach((m) => {
            const nome = m.parte?.nome ?? 'Sem identificação';
            soma.set(nome, (soma.get(nome) ?? 0) + m.valor);
        });
        return [...soma.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor).slice(0, 5);
    };

    const entradas = filtrados.filter((m) => m.tipo === 'RECEBER').reduce((s, m) => s + m.valor, 0);
    const saidas = filtrados.filter((m) => m.tipo === 'PAGAR').reduce((s, m) => s + m.valor, 0);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
    const paginaAtual = Math.min(page, totalPaginas);
    const pagina = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);
    const meta = { page: paginaAtual, pageSize: PAGE_SIZE, total: filtrados.length, totalPages: totalPaginas };

    const mudar = (acao) => (evento) => {
        acao(evento.target.value);
        setPage(1);
    };

    return (
        <>
            <Card>
                <SectionTitle icon={FaUsers} tom="blue">Movimentações por cliente e fornecedor</SectionTitle>

                <Filtros>
                    <FilterSelect
                        label="Mostrar"
                        placeholder={null}
                        value={natureza}
                        onChange={mudar(setNatureza)}
                        options={[{ value: 'REALIZADO', label: 'Realizado (pagamentos)' }, { value: 'PREVISTO', label: 'Previsto (vencimentos)' }]}
                    />
                    <FilterSelect
                        label="Sentido"
                        placeholder="Entradas e saídas"
                        value={sentido}
                        onChange={mudar(setSentido)}
                        options={[{ value: 'RECEBER', label: 'Só entradas (clientes)' }, { value: 'PAGAR', label: 'Só saídas (fornecedores)' }]}
                    />
                    <FilterInput label="Buscar" placeholder="Cliente, fornecedor ou descrição" value={busca} onChange={mudar(setBusca)} />
                </Filtros>

                {mes && (
                    <Row style={{ marginBottom: 12 }}>
                        <Badge $tone="info">Mês: {mesLabel(mes)}</Badge>
                        <Button size="sm" variant="secondary" onClick={() => { onMes(''); setPage(1); }}>Ver o período todo</Button>
                    </Row>
                )}

                <Row $gap={24} style={{ marginBottom: 4 }}>
                    <span>Entradas: <strong style={{ color: colors.success }}>{brl(entradas)}</strong></span>
                    <span>Saídas: <strong style={{ color: colors.danger }}>{brl(saidas)}</strong></span>
                    <span>Saldo: <strong style={{ color: entradas - saidas >= 0 ? colors.success : colors.danger }}>{brl(entradas - saidas)}</strong></span>
                </Row>
            </Card>

            <Destaques>
                <Ranking titulo="Clientes que mais pagaram" icone={FaUsers} itens={ranking('RECEBER')} cor={colors.success} onEscolher={(nome) => { setBusca(nome); setPage(1); }} />
                <Ranking titulo="Fornecedores que mais receberam" icone={FaTruck} itens={ranking('PAGAR')} cor="#FB8C00" onEscolher={(nome) => { setBusca(nome); setPage(1); }} />
            </Destaques>

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : (
                <>
                    <DataTable
                        loading={isLoading}
                        rows={pagina}
                        rowKey={(m) => m.id}
                        onRowClick={(m) => setAberto(m.lancamentoId)}
                        emptyTitle="Nenhuma movimentação"
                        emptyDescription="Ajuste o período ou os filtros."
                        columns={[
                            { key: 'data', header: 'Data', render: (m) => formatDate(m.data) },
                            {
                                key: 'parte',
                                header: 'Cliente / Fornecedor',
                                render: (m) => (m.parte
                                    ? <span><strong>{m.parte.nome}</strong> <Badge $tone={PAPEL[m.parte.papel].tom}>{PAPEL[m.parte.papel].rotulo}</Badge></span>
                                    : <Muted>Sem identificação</Muted>),
                            },
                            { key: 'descricao', header: 'Descrição', render: (m) => m.descricao },
                            { key: 'categoria', header: 'Categoria', render: (m) => m.categoria ?? <Muted>—</Muted> },
                            {
                                key: 'valor',
                                header: 'Valor',
                                render: (m) => (
                                    <strong style={{ color: m.tipo === 'RECEBER' ? colors.success : colors.danger, fontVariantNumeric: 'tabular-nums' }}>
                                        {m.tipo === 'RECEBER' ? '+' : '−'} {brl(m.valor)}
                                    </strong>
                                ),
                            },
                        ]}
                    />
                    <PaginationBar meta={meta} onPageChange={setPage} label="movimentações" />
                    {data?.truncado && <Muted>Mostrando as primeiras 5.000 movimentações do período. Reduza o período para ver o restante.</Muted>}
                </>
            )}

            {aberto && <LancamentoDialog id={aberto} onClose={() => setAberto(null)} />}
        </>
    );
}
