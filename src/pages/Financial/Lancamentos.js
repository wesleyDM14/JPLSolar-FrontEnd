import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi, saveBlob } from '../../api/resources';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Badge, Button, DataTable, ErrorBlock, FilterSelect, Muted, PaginationBar, Row, tokens } from '../../ui';
import { formatDate } from '../../utils/masks';
import BaixaDialog from './BaixaDialog';
import ClienteDialog from './ClienteDialog';
import ConciliarDialog from './boleto/ConciliarDialog';
import EmitirLoteDialog from './boleto/EmitirLoteDialog';
import FiltrosPanel, { filtrosPadrao, filtrosSemPeriodo } from './FiltrosPanel';
import { agruparOptions, brl, mesLabel, primeiroDiaDoMes, situacaoInfo, TIPO, ultimoDiaDoMes } from './format';
import LancamentoDialog from './LancamentoDialog';
import LancamentoFormDialog from './LancamentoFormDialog';

const { colors } = tokens;

const Totais = styled.div`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    background: ${colors.surface};
    border-radius: ${tokens.radius};
    box-shadow: ${tokens.shadow};
    padding: 12px 18px;
    margin-bottom: 14px;

    .item small {
        display: block;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${colors.muted};
    }

    .item strong {
        font-size: 1.15rem;
        font-variant-numeric: tabular-nums;
    }
`;

const ClienteLink = styled.button`
    padding: 0;
    border: 0;
    background: none;
    color: ${colors.info};
    font: inherit;
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: transparent;
    transition: text-decoration-color 0.15s;

    &:hover {
        text-decoration-color: currentColor;
    }
`;

const PAGE_SIZE = 20;

/** Lista de contas a receber ou a pagar, com filtros avançados, agrupamento e exportação. */
export default function Lancamentos({ tipo, inicial }) {
    const receber = tipo === TIPO.RECEBER;
    const [filtros, setFiltros] = useState(() => (inicial && Object.keys(inicial).length > 0 ? { ...filtrosSemPeriodo(), ...inicial } : filtrosPadrao()));
    const [agrupar, setAgrupar] = useState('');
    const [sort, setSort] = useState({ field: 'dataVencimento', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [novo, setNovo] = useState(false);
    const [detalheId, setDetalheId] = useState(null);
    const [clienteId, setClienteId] = useState(null);
    const [baixando, setBaixando] = useState(null);
    const [exportando, setExportando] = useState(false);
    const [conciliando, setConciliando] = useState(false);
    const [emitindoLote, setEmitindoLote] = useState(false);

    const busca = useDebouncedValue(filtros.search);
    // clienteNome/fornecedorNome servem só para exibir; a API não os conhece.
    // eslint-disable-next-line no-unused-vars
    const { clienteNome, fornecedorNome, ...filtrosApi } = filtros;
    const params = { ...filtrosApi, search: busca, tipo };

    const categorias = useQuery({ queryKey: ['categorias', tipo], queryFn: () => financeiroApi.categorias({ tipo }) });
    const contas = useQuery({ queryKey: ['contas-financeiras'], queryFn: financeiroApi.contasFinanceiras });

    const lista = useQuery({
        queryKey: ['financeiro', 'lancamentos', params, sort, page],
        queryFn: () => financeiroApi.lancamentos({ ...params, page, pageSize: PAGE_SIZE, sort: `${sort.field}:${sort.direction}` }),
        placeholderData: (anterior) => anterior,
        enabled: !agrupar,
    });

    const grupos = useQuery({
        queryKey: ['financeiro', 'agrupado', params, agrupar],
        queryFn: () => financeiroApi.agrupado({ ...params, por: agrupar }),
        enabled: Boolean(agrupar),
    });

    const alterarFiltros = (parcial) => {
        setFiltros((atual) => ({ ...atual, ...parcial }));
        setPage(1);
    };

    const alternarOrdem = (campo) => {
        setPage(1);
        setSort((atual) => (atual.field === campo ? { field: campo, direction: atual.direction === 'asc' ? 'desc' : 'asc' } : { field: campo, direction: 'asc' }));
    };

    const exportar = async () => {
        setExportando(true);
        try {
            const resposta = await financeiroApi.exportarCsv(params);
            saveBlob(resposta.data, `${receber ? 'a-receber' : 'a-pagar'}.csv`);
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível exportar.'));
        } finally {
            setExportando(false);
        }
    };

    // Clicar em um grupo aplica o filtro correspondente e volta para a lista.
    const abrirGrupo = (grupo) => {
        if (grupo.chave === '-') return;
        const aplicar = {
            categoria: { categoriaId: grupo.chave },
            conta: { contaId: grupo.chave },
            mes: { vencimentoDe: primeiroDiaDoMes(grupo.chave), vencimentoAte: ultimoDiaDoMes(grupo.chave) },
            situacao: { situacao: grupo.chave },
            cliente: { clienteId: grupo.chave, clienteNome: grupo.rotulo },
            fornecedor: { fornecedorId: grupo.chave, fornecedorNome: grupo.rotulo },
        }[agrupar];

        if (!aplicar) return;
        setFiltros((atual) => ({ ...atual, ...aplicar }));
        setAgrupar('');
        setPage(1);
    };

    const categoriaOptions = (categorias.data ?? []).map((categoria) => ({ value: categoria.id, label: categoria.nome }));
    const contaOptions = (contas.data ?? []).map((conta) => ({ value: conta.id, label: conta.nome }));
    const totais = agrupar ? grupos.data?.total : lista.data?.totais;
    const erro = (agrupar ? grupos.error : lista.error) || null;

    const colunas = [
        {
            key: 'vencimento',
            header: 'Vencimento',
            sortKey: 'dataVencimento',
            render: (l) => (
                <span>
                    {formatDate(l.dataVencimento)}
                    {l.situacao === 'ATRASADO' && <div style={{ color: colors.danger, fontSize: '0.75rem' }}>{l.diasAtraso}d de atraso</div>}
                </span>
            ),
        },
        { key: 'emissao', header: 'Emissão', sortKey: 'dataEmissao', render: (l) => (l.dataEmissao ? formatDate(l.dataEmissao) : <Muted>—</Muted>) },
        {
            key: 'descricao',
            header: 'Descrição',
            sortKey: 'descricao',
            render: (l) => (
                <span>
                    <strong>{l.descricao}</strong>
                    {l.boleto && <> <Badge $tone="info">Boleto</Badge></>}
                    {l.contratoId && <> <Badge>Contrato</Badge></>}
                </span>
            ),
        },
        {
            key: 'parte',
            header: receber ? 'Cliente' : 'Fornecedor',
            sortKey: receber ? 'cliente' : undefined,
            render: (l) => {
                if (receber && l.cliente) {
                    // Abre o painel do cliente sem abrir o detalhe do lançamento.
                    return (
                        <ClienteLink
                            type="button"
                            title="Ver usinas e financeiro do cliente"
                            onClick={(evento) => {
                                evento.stopPropagation();
                                setClienteId(l.cliente.id);
                            }}
                        >
                            {l.cliente.nome}
                        </ClienteLink>
                    );
                }
                return l.fornecedor?.nome ?? <Muted>—</Muted>;
            },
        },
        { key: 'categoria', header: 'Categoria', render: (l) => l.categoria?.nome ?? <Muted>—</Muted> },
        { key: 'valor', header: 'Valor', sortKey: 'valor', render: (l) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{brl(l.valor)}</span> },
        {
            key: 'restante',
            header: 'Em aberto',
            render: (l) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{l.status === 'CANCELADO' ? '—' : brl(l.valorRestante)}</span>,
        },
        {
            key: 'situacao',
            header: 'Situação',
            sortKey: 'status',
            render: (l) => {
                const situacao = situacaoInfo(l.situacao, l.tipo);
                return <Badge $tone={situacao.tone}>{situacao.label}</Badge>;
            },
        },
        {
            key: 'acoes',
            header: '',
            render: (l) => (['ABERTO', 'PARCIAL'].includes(l.status) ? (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={(evento) => {
                        evento.stopPropagation();
                        setBaixando(l);
                    }}
                >
                    {receber ? 'Receber' : 'Pagar'}
                </Button>
            ) : null),
        },
    ];

    const colunasGrupo = [
        { key: 'rotulo', header: agruparOptions(tipo).find((o) => o.value === agrupar)?.label ?? 'Grupo', render: (g) => <strong>{agrupar === 'mes' ? mesLabel(g.rotulo) : g.rotulo}</strong> },
        { key: 'quantidade', header: 'Lançamentos', render: (g) => g.quantidade },
        { key: 'valor', header: 'Total', render: (g) => brl(g.valor) },
        { key: 'valorPago', header: receber ? 'Recebido' : 'Pago', render: (g) => brl(g.valorPago) },
        { key: 'valorRestante', header: 'Em aberto', render: (g) => brl(g.valorRestante) },
        { key: 'valorAtrasado', header: 'Vencido', render: (g) => (g.valorAtrasado > 0 ? <span style={{ color: colors.danger }}>{brl(g.valorAtrasado)}</span> : <Muted>—</Muted>) },
    ];

    return (
        <>
            <Row $justify="flex-end" style={{ marginBottom: 14 }}>
                <Row>
                    {receber && <Button variant="secondary" onClick={() => setConciliando(true)}>Conciliar com Sicredi</Button>}
                    {receber && <Button variant="secondary" onClick={() => setEmitindoLote(true)}>Emitir boletos</Button>}
                    <Button variant="secondary" loading={exportando} onClick={exportar}>Exportar CSV</Button>
                    <Button onClick={() => setNovo(true)}>{receber ? 'Nova conta a receber' : 'Nova conta a pagar'}</Button>
                </Row>
            </Row>

            <FiltrosPanel
                tipo={tipo}
                filtros={filtros}
                onChange={alterarFiltros}
                categorias={categoriaOptions}
                contas={contaOptions}
                onLimpar={() => { setFiltros(filtrosPadrao()); setAgrupar(''); setPage(1); }}
            />

            <Row style={{ marginBottom: 12 }}>
                <div style={{ minWidth: 240 }}>
                    <FilterSelect
                        label="Agrupar por"
                        options={agruparOptions(tipo)}
                        placeholder="Sem agrupamento (lista)"
                        value={agrupar}
                        onChange={(evento) => { setAgrupar(evento.target.value); setPage(1); }}
                    />
                </div>
            </Row>

            {totais && (
                <Totais>
                    <div className="item"><small>Lançamentos</small><strong>{totais.quantidade ?? lista.data?.meta?.total ?? 0}</strong></div>
                    <div className="item"><small>Total</small><strong>{brl(totais.valor)}</strong></div>
                    <div className="item"><small>{receber ? 'Recebido' : 'Pago'}</small><strong>{brl(totais.valorPago)}</strong></div>
                    <div className="item"><small>Em aberto</small><strong>{brl(totais.valorRestante)}</strong></div>
                    {totais.valorAtrasado !== undefined && <div className="item"><small>Vencido</small><strong style={{ color: totais.valorAtrasado > 0 ? colors.danger : undefined }}>{brl(totais.valorAtrasado)}</strong></div>}
                </Totais>
            )}

            {erro ? (
                <ErrorBlock message={errorMessage(erro)} onRetry={() => (agrupar ? grupos.refetch() : lista.refetch())} />
            ) : agrupar ? (
                <DataTable
                    columns={colunasGrupo}
                    rows={grupos.data?.grupos}
                    loading={grupos.isLoading}
                    rowKey={(g) => g.chave}
                    onRowClick={abrirGrupo}
                    emptyTitle="Nada para agrupar"
                    emptyDescription="Ajuste os filtros."
                />
            ) : (
                <>
                    <DataTable
                        columns={colunas}
                        rows={lista.data?.data}
                        loading={lista.isLoading}
                        sort={sort}
                        onSort={alternarOrdem}
                        onRowClick={(l) => setDetalheId(l.id)}
                        emptyTitle="Nenhum lançamento encontrado"
                        emptyDescription="Ajuste os filtros ou crie um novo lançamento."
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label={lista.isFetching ? 'atualizando…' : 'lançamentos'} />
                </>
            )}

            <LancamentoFormDialog open={novo} tipo={tipo} onClose={() => setNovo(false)} />
            <BaixaDialog open={Boolean(baixando)} lancamento={baixando} onClose={() => setBaixando(null)} />
            {detalheId && <LancamentoDialog id={detalheId} onClose={() => setDetalheId(null)} />}
            {clienteId && <ClienteDialog clienteId={clienteId} onClose={() => setClienteId(null)} />}

            {conciliando && <ConciliarDialog onClose={() => setConciliando(false)} />}
            {emitindoLote && <EmitirLoteDialog filtros={filtrosApi} onClose={() => setEmitindoLote(false)} />}
        </>
    );
}
