import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBan, FaCheckCircle, FaFileContract, FaHandshake, FaPlus, FaTools } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { contratosApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, RowActions, ErrorBlock, FilterInput, FilterSelect, FiltersBar, Muted, Page, PageHeader, PaginationBar, StatCard, StatGrid } from '../../ui';
import { statusContratoLabel, statusContratoOptions, statusContratoTone, tipoContratoOptions } from '../../utils/enums';
import { formatCurrency, formatDate } from '../../utils/masks';

export default function ContratosPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [excluindo, setExcluindo] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '', tipo: '', de: '', ate: '' });
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
        setFilters((current) => ({ ...current, status: current.status === status ? '' : status }));
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
            : { field, direction: 'desc' }));
    };

    const columns = [
        {
            key: 'cliente',
            header: 'Cliente',
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
        { key: 'status', header: 'Situação', render: (c) => <Badge $tone={statusContratoTone[c.status]}>{statusContratoLabel(c.status)}</Badge> },
        {
            key: 'acoes',
            header: '',
            width: 130,
            render: (c) => (
                <RowActions
                    onVer={() => navigate(`/contratos/${c.id}`)}
                    onEditar={() => navigate(`/contratos/${c.id}/editar`)}
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
                <StatCard icon={FaBan} tom="red" rotulo="Cancelados" valor={cancelados.data?.meta?.total ?? 0} detalhe="encerrados" ativo={filters.status === 'CANCELADO'} onClick={() => filtrarStatus('CANCELADO')} delay={120} />
            </StatGrid>

            <FiltersBar>
                <FilterInput label="Buscar por nome do cliente" placeholder="Digite o nome, CPF ou CNPJ" value={filters.search} onChange={setFilter('search')} />
                <FilterSelect label="Tipo" options={tipoContratoOptions} value={filters.tipo} onChange={setFilter('tipo')} />
                <FilterSelect label="Situação" options={statusContratoOptions} value={filters.status} onChange={setFilter('status')} />
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
