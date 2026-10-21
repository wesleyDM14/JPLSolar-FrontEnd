import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBan, FaCheckCircle, FaExclamationTriangle, FaFileContract, FaHandshake, FaPlus, FaTools, FaUndo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { contratosApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import InativarContratoDialog from './InativarContratoDialog';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, RowActions, ErrorBlock, FilterInput, FilterSelect, FiltersBar, Muted, Page, PageHeader, PaginationBar, StatCard, StatGrid, tokens } from '../../ui';
import { statusContratoLabel, statusContratoOptions, statusContratoTone, tipoContratoOptions } from '../../utils/enums';
import { formatCurrency, formatDate } from '../../utils/masks';

const { colors } = tokens;

const financeiroOptions = [
    { value: 'SEM_LANCAMENTOS', label: 'Sem parcelas no financeiro' },
    { value: 'COM_LANCAMENTOS', label: 'Com parcelas no financeiro' },
    { value: 'VENCIDAS', label: 'Com parcela vencida' },
];

/** Resumo do contrato no financeiro: parcelas pagas, vencidas e próximo vencimento. */
function FinanceiroDoContrato({ contrato }) {
    const f = contrato.financeiro;

    if (!f) {
        return contrato.status === 'CANCELADO'
            ? <Muted>—</Muted>
            : <Badge $tone="warning" title="Nenhuma parcela deste contrato foi lançada em contas a receber"><FaExclamationTriangle /> Sem lançamentos</Badge>;
    }

    const percentual = f.parcelas > 0 ? Math.round((f.pagas / f.parcelas) * 100) : 0;

    return (
        <div style={{ minWidth: 150 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.82rem' }}>
                <strong>{f.pagas} de {f.parcelas} pagas</strong>
                <Muted>{percentual}%</Muted>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: colors.neutralBg, margin: '4px 0', overflow: 'hidden' }}>
                <div style={{ width: `${percentual}%`, height: '100%', background: colors.success }} />
            </div>
            {f.vencidas > 0 ? (
                <span style={{ color: colors.danger, fontSize: '0.78rem', fontWeight: 600 }}>{f.vencidas} vencida(s) · {formatCurrency(f.valorVencido)}</span>
            ) : f.proximoVencimento ? (
                <Muted>próx. {formatDate(f.proximoVencimento)}</Muted>
            ) : (
                <Muted>{f.pagas === f.parcelas ? 'tudo recebido' : 'sem vencimento futuro'}</Muted>
            )}
        </div>
    );
}

export default function ContratosPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [excluindo, setExcluindo] = useState(null);
    const [inativando, setInativando] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '', tipo: '', financeiro: '', de: '', ate: '' });
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'dataContrato', direction: 'desc' });

    const debouncedSearch = useDebouncedValue(filters.search);
    const params = { ...filters, search: debouncedSearch, page, pageSize: 20, sort: `${sort.field}:${sort.direction}` };

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['contratos', params],
        queryFn: () => contratosApi.list(params),
        placeholderData: (previous) => previous,
    });

    const total = (status) => ({ queryKey: ['contratos', 'total', status], queryFn: () => contratosApi.list({ pageSize: 1, status }) });
    const ativos = useQuery(total('ATIVO'));
    const quitados = useQuery(total('QUITADO'));
    const cancelados = useQuery(total('CANCELADO'));
    const contagem = (financeiro) => ({ queryKey: ['contratos', 'total', 'ATIVO', financeiro], queryFn: () => contratosApi.list({ pageSize: 1, status: 'ATIVO', financeiro }) });
    const semLancamentos = useQuery(contagem('SEM_LANCAMENTOS'));
    const comVencidas = useQuery(contagem('VENCIDAS'));

    const reativar = useMutation({
        mutationFn: (id) => contratosApi.updateStatus(id, 'ATIVO'),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['contratos'] });
            toast.success('Contrato reativado.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const excluir = useMutation({
        mutationFn: (id) => contratosApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['contratos'] });
            setExcluindo(null);
            toast.success('Contrato excluído.');
        },
        onError: (erro) => {
            setExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    const filtrarStatus = (status) => {
        setFilters((current) => ({ ...current, status: current.status === status ? '' : status, financeiro: '' }));
        setPage(1);
    };

    // Os cartões de financeiro olham só contratos ativos.
    const filtrarFinanceiro = (financeiro) => {
        setFilters((current) => (current.financeiro === financeiro && current.status === 'ATIVO'
            ? { ...current, financeiro: '' }
            : { ...current, status: 'ATIVO', financeiro }));
        setPage(1);
    };

    const setFilter = (name) => (event) => {
        setFilters((current) => ({ ...current, [name]: event.target.value }));
        setPage(1);
    };

    const toggleSort = (field) => {
        setPage(1);
        setSort((current) => (current.field === field
            ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            : { field, direction: field === 'cliente' ? 'asc' : 'desc' }));
    };

    const columns = [
        {
            key: 'cliente',
            header: 'Cliente',
            sortKey: 'cliente',
            render: (c) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar nome={c.cliente.nome} size={38} />
                    <div>
                        <strong>{c.cliente.nome}</strong>
                        <div><Muted>{c.cliente.tipoPessoa === 'PESSOA_JURIDICA' ? 'Pessoa jurídica' : 'Pessoa física'}</Muted></div>
                    </div>
                </div>
            ),
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (c) => (
                <Badge $tone={c.tipo === 'COMPRA_VENDA' ? 'neutral' : 'info'}>
                    {c.tipo === 'COMPRA_VENDA' ? <FaHandshake /> : <FaTools />}
                    {c.tipo === 'COMPRA_VENDA' ? 'Financiado' : c.tipo === 'SERVICO_GERAL' ? 'Serviço' : 'Instalação'}
                </Badge>
            ),
        },
        { key: 'dataContrato', header: 'Data', sortKey: 'dataContrato', render: (c) => formatDate(c.dataContrato) },
        { key: 'priceTotal', header: 'Valor', sortKey: 'priceTotal', render: (c) => formatCurrency(c.priceTotal) },
        { key: 'parcelas', header: 'Parcelas', render: (c) => `${c.quantParcelas}x ${formatCurrency(c.priceParcela)}` },
        { key: 'promissoria', header: 'Promissória', render: (c) => (c.promissoria ? `${c.promissoria.numero}/${c.promissoria.ano}` : <Muted>—</Muted>) },
        { key: 'financeiro', header: 'Financeiro', render: (c) => <FinanceiroDoContrato contrato={c} /> },
        { key: 'status', header: 'Situação', render: (c) => <Badge $tone={statusContratoTone[c.status]}>{statusContratoLabel(c.status)}</Badge> },
        {
            key: 'acoes',
            header: '',
            width: 160,
            render: (c) => (
                <RowActions
                    onVer={() => navigate(`/contratos/${c.id}`)}
                    onEditar={() => navigate(`/contratos/${c.id}/editar`)}
                    extras={[c.status === 'CANCELADO'
                        ? { rotulo: 'Reativar contrato', tom: 'verde', icon: FaUndo, onClick: () => reativar.mutate(c.id) }
                        : { rotulo: 'Inativar contrato', tom: 'vermelho', icon: FaBan, onClick: () => setInativando(c) }]}
                    onExcluir={() => setExcluindo(c)}
                />
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaFileContract}
                tone="purple"
                title="Contratos"
                subtitle="Vendas financiadas e prestação de serviços."
                actions={<Button icon={<FaPlus />} onClick={() => navigate('/contratos/novo')}>Novo contrato</Button>}
            />

            <StatGrid>
                <StatCard icon={FaFileContract} tom="blue" rotulo="Ativos" valor={ativos.data?.meta?.total ?? 0} detalhe="em andamento" ativo={filters.status === 'ATIVO'} onClick={() => filtrarStatus('ATIVO')} delay={0} />
                <StatCard icon={FaCheckCircle} tom="green" rotulo="Quitados" valor={quitados.data?.meta?.total ?? 0} detalhe="pagos por completo" ativo={filters.status === 'QUITADO'} onClick={() => filtrarStatus('QUITADO')} delay={60} />
                <StatCard icon={FaBan} tom="red" rotulo="Inativos" valor={cancelados.data?.meta?.total ?? 0} detalhe="encerrados" ativo={filters.status === 'CANCELADO'} onClick={() => filtrarStatus('CANCELADO')} delay={120} />
                <StatCard icon={FaExclamationTriangle} tom="orange" rotulo="Sem lançamentos" valor={semLancamentos.data?.meta?.total ?? 0} detalhe="ativos sem parcelas no financeiro" ativo={filters.financeiro === 'SEM_LANCAMENTOS'} onClick={() => filtrarFinanceiro('SEM_LANCAMENTOS')} delay={180} />
                <StatCard icon={FaExclamationTriangle} tom="red" rotulo="Com parcela vencida" valor={comVencidas.data?.meta?.total ?? 0} detalhe="ativos com atraso" ativo={filters.financeiro === 'VENCIDAS'} onClick={() => filtrarFinanceiro('VENCIDAS')} delay={240} />
            </StatGrid>

            <FiltersBar>
                <FilterInput label="Buscar por nome do cliente" placeholder="Digite o nome, CPF ou CNPJ" value={filters.search} onChange={setFilter('search')} />
                <FilterSelect label="Tipo" options={tipoContratoOptions} value={filters.tipo} onChange={setFilter('tipo')} />
                <FilterSelect label="Situação" options={statusContratoOptions} value={filters.status} onChange={setFilter('status')} />
                <FilterSelect label="Financeiro" options={financeiroOptions} value={filters.financeiro} onChange={setFilter('financeiro')} />
                <FilterInput label="De" type="date" value={filters.de} onChange={setFilter('de')} />
                <FilterInput label="Até" type="date" value={filters.ate} onChange={setFilter('ate')} />
            </FiltersBar>

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : (
                <>
                    <DataTable
                        columns={columns}
                        rows={data?.data}
                        loading={isLoading}
                        sort={sort}
                        onSort={toggleSort}
                        onRowClick={(contrato) => navigate(`/contratos/${contrato.id}`)}
                        emptyTitle="Nenhum contrato encontrado"
                        emptyDescription="Ajuste os filtros ou crie um novo contrato."
                    />
                    <PaginationBar meta={data?.meta} onPageChange={setPage} label={isFetching ? 'atualizando…' : 'contratos'} />
                </>
            )}

            {inativando && <InativarContratoDialog contrato={inativando} onClose={() => setInativando(null)} />}

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir contrato"
                message={`Excluir o contrato de ${excluindo?.cliente?.nome ?? ''}? Contratos com parcelas no financeiro não podem ser excluídos.`}
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />
        </Page>
    );
}
