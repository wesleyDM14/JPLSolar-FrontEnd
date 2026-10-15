import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBolt, FaCheckCircle, FaExclamationTriangle, FaPlus, FaPowerOff, FaQuestionCircle } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import { TbSolarPanel2 } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, usinasApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Badge, Button, ConfirmDialog, DataTable, Dot, RowActions, ErrorBlock, FilterInput, FilterSelect, FiltersBar, Muted, Page, PageHeader, PaginationBar, StatCard, StatGrid } from '../../ui';
import { inversorLabel, inversorOptions, ufOptions } from '../../utils/enums';
import { statusFilterOptions, tempoDesde, usinaStatus } from '../../utils/usinaStatus';

const ativaOptions = [
    { value: 'true', label: 'Ativas' },
    { value: 'false', label: 'Inativas' },
];

export default function UsinasPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [excluindo, setExcluindo] = useState(null);
    const [inativando, setInativando] = useState(null);
    const [filters, setFilters] = useState({ search: '', inversor: '', status: '', ativa: '', uf: '' });
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'code', direction: 'asc' });

    const debouncedSearch = useDebouncedValue(filters.search);
    const params = { ...filters, search: debouncedSearch, page, pageSize: 20, sort: `${sort.field}:${sort.direction}` };

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['usinas', params],
        queryFn: () => usinasApi.list(params),
        placeholderData: (previous) => previous,
    });

    // Totais por estado vêm do painel (leitura instantânea do banco).
    const painel = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, refetchInterval: 60 * 1000 });
    const porStatus = painel.data?.porStatus ?? {};

    const excluir = useMutation({
        mutationFn: (id) => usinasApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['usinas'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setExcluindo(null);
            toast.success('Usina excluída.');
        },
        onError: (erro) => {
            setExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    // Inativar tira a usina do monitoramento e das contagens (clientes, contratos e painel); os dados são mantidos.
    const alterarAtiva = useMutation({
        mutationFn: ({ id, ativa }) => usinasApi.update(id, { ativa }),
        onSuccess: async (_usina, { ativa }) => {
            await Promise.all(['usinas', 'dashboard', 'clientes', 'cliente', 'contratos', 'contrato'].map((chave) => queryClient.invalidateQueries({ queryKey: [chave] })));
            setInativando(null);
            toast.success(ativa ? 'Usina ativada.' : 'Usina inativada.');
        },
        onError: (erro) => {
            setInativando(null);
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
            : { field, direction: 'asc' }));
    };

    const columns = [
        { key: 'code', header: 'Código', sortKey: 'code', render: (u) => <strong>{u.code}</strong> },
        { key: 'cliente', header: 'Cliente', sortKey: 'cliente', render: (u) => u.client.nome },
        { key: 'inversor', header: 'Inversor', sortKey: 'inversor', render: (u) => inversorLabel(u.inversor) },
        { key: 'installedPower', header: 'Potência', sortKey: 'installedPower', render: (u) => `${u.installedPower} kWp` },
        { key: 'local', header: 'Local', sortKey: 'cidade', render: (u) => (u.cidade ? `${u.cidade}${u.uf ? `/${u.uf}` : ''}` : <Muted>{u.local}</Muted>) },
        {
            key: 'status',
            header: 'Status',
            sortKey: 'statusMonitoramento',
            render: (u) => {
                if (!u.ativa) return <Badge $tone="neutral">Inativa</Badge>;
                const status = usinaStatus(u.statusMonitoramento);
                return (
                    <span title={status.hint}>
                        <Badge $tone={status.tone}>
                            <Dot $tone={{ success: 'green', info: 'blue', warning: 'orange', danger: 'red', neutral: 'gray' }[status.tone]} $pulse={status.tone === 'danger'} />
                            {status.label}
                        </Badge>
                    </span>
                );
            },
        },
        {
            key: 'ultimaLeituraEm',
            header: 'Última leitura',
            sortKey: 'ultimaLeituraEm',
            render: (u) => <Muted>{u.ultimaLeituraEm ? tempoDesde(u.ultimaLeituraEm) : '—'}</Muted>,
        },
        {
            key: 'acoes',
            header: '',
            width: 170,
            render: (u) => (
                <RowActions
                    onVer={() => navigate(`/usinas/${u.id}`)}
                    onEditar={() => navigate(`/usinas/${u.id}/editar`)}
                    extras={[
                        u.ativa
                            ? { rotulo: 'Inativar usina', tom: 'vermelho', icon: FaPowerOff, onClick: () => setInativando(u) }
                            : { rotulo: 'Ativar usina', tom: 'verde', icon: FaPowerOff, onClick: () => alterarAtiva.mutate({ id: u.id, ativa: true }) },
                    ]}
                    onExcluir={() => setExcluindo(u)}
                />
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={TbSolarPanel2}
                tone="orange"
                title="Usinas"
                subtitle="Usinas cadastradas e monitoradas."
                actions={<Button icon={<FaPlus />} onClick={() => navigate('/usinas/nova')}>Nova usina</Button>}
            />

            <StatGrid>
                <StatCard icon={FaCheckCircle} tom="green" rotulo="Online" valor={porStatus.ONLINE ?? 0} detalhe="gerando agora" ativo={filters.status === 'ONLINE'} onClick={() => filtrarStatus('ONLINE')} delay={0} />
                <StatCard icon={MdWifiOff} tom="orange" rotulo="Offline" valor={porStatus.OFFLINE ?? 0} detalhe="sem comunicação" ativo={filters.status === 'OFFLINE'} onClick={() => filtrarStatus('OFFLINE')} delay={50} />
                <StatCard icon={FaExclamationTriangle} tom="red" rotulo="Alerta" valor={porStatus.ALERTA ?? 0} detalhe="defeito no inversor" ativo={filters.status === 'ALERTA'} onClick={() => filtrarStatus('ALERTA')} delay={100} />
                <StatCard icon={FaQuestionCircle} tom="gray" rotulo="Sem leitura" valor={porStatus.SEM_LEITURA ?? 0} detalhe="portal não consultado" ativo={filters.status === 'SEM_LEITURA'} onClick={() => filtrarStatus('SEM_LEITURA')} delay={150} />
                <StatCard
                    icon={FaBolt}
                    tom="blue"
                    rotulo="Gerou hoje"
                    valor={Number(painel.data?.geracaoHojeKwh ?? 0)}
                    formato={(n) => `${Math.round(n).toLocaleString('pt-BR')} kWh`}
                    detalhe={`${painel.data?.totalUsinas ?? 0} usinas ativas`}
                    delay={200}
                />
            </StatGrid>

            <FiltersBar>
                <FilterInput label="Buscar por nome do cliente" placeholder="Nome, CPF/CNPJ, código da usina ou local" value={filters.search} onChange={setFilter('search')} />
                <FilterSelect label="Inversor" options={inversorOptions} value={filters.inversor} onChange={setFilter('inversor')} />
                <FilterSelect label="Status" options={statusFilterOptions} value={filters.status} onChange={setFilter('status')} />
                <FilterSelect label="Situação" options={ativaOptions} value={filters.ativa} onChange={setFilter('ativa')} />
                <FilterSelect label="UF" options={ufOptions} value={filters.uf} onChange={setFilter('uf')} />
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
                        onRowClick={(usina) => navigate(`/usinas/${usina.id}`)}
                        emptyTitle="Nenhuma usina encontrada"
                        emptyDescription="Ajuste os filtros ou cadastre uma nova usina."
                    />
                    <PaginationBar meta={data?.meta} onPageChange={setPage} label={isFetching ? 'atualizando…' : 'usinas'} />
                </>
            )}

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir usina"
                message={`Excluir a usina ${excluindo?.code ?? ''}? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />

            <ConfirmDialog
                open={Boolean(inativando)}
                title="Inativar usina"
                message={`Inativar a usina ${inativando?.code ?? ''}? Ela deixa de ser monitorada e não entra mais nas contagens; o cadastro é mantido e pode ser reativado.`}
                confirmLabel="Inativar"
                loading={alterarAtiva.isPending}
                onConfirm={() => alterarAtiva.mutate({ id: inativando.id, ativa: false })}
                onClose={() => setInativando(null)}
            />
        </Page>
    );
}
