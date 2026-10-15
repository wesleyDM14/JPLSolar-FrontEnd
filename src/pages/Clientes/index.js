import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBuilding, FaPlus, FaUser, FaUsers } from 'react-icons/fa';
import { TbSolarPanel2 } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { clientesApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Avatar, Badge, Button, ConfirmDialog, DataTable, RowActions, ErrorBlock, FilterInput, FilterSelect, FiltersBar, Muted, Page, PageHeader, PaginationBar, StatCard, StatGrid } from '../../ui';
import { tipoPessoaOptions } from '../../utils/enums';
import { formatDocumento, formatPhone } from '../../utils/masks';

export default function ClientesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [excluindo, setExcluindo] = useState(null);
    const [search, setSearch] = useState('');
    const [tipoPessoa, setTipoPessoa] = useState('');
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'nome', direction: 'asc' });

    const debouncedSearch = useDebouncedValue(search);

    const params = { search: debouncedSearch, tipoPessoa, page, pageSize: 20, sort: `${sort.field}:${sort.direction}` };

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['clientes', params],
        queryFn: () => clientesApi.list(params),
        placeholderData: (previous) => previous,
    });

    // Totais por tipo (consultas de 1 item só para ler o total).
    const totalGeral = useQuery({ queryKey: ['clientes', 'total', ''], queryFn: () => clientesApi.list({ pageSize: 1 }) });
    const totalPf = useQuery({ queryKey: ['clientes', 'total', 'PESSOA_FISICA'], queryFn: () => clientesApi.list({ pageSize: 1, tipoPessoa: 'PESSOA_FISICA' }) });
    const totalPj = useQuery({ queryKey: ['clientes', 'total', 'PESSOA_JURIDICA'], queryFn: () => clientesApi.list({ pageSize: 1, tipoPessoa: 'PESSOA_JURIDICA' }) });

    const excluir = useMutation({
        mutationFn: (id) => clientesApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['clientes'] });
            setExcluindo(null);
            toast.success('Cliente excluído.');
        },
        onError: (erro) => {
            setExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    const toggleSort = (field) => {
        setPage(1);
        setSort((current) => (current.field === field
            ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            : { field, direction: 'asc' }));
    };

    const columns = [
        {
            key: 'nome',
            header: 'Cliente',
            sortKey: 'nome',
            render: (c) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar nome={c.nome} size={38} />
                    <div>
                        <strong>{c.nome}</strong>
                        {c.nomeFantasia && <div><Muted>{c.nomeFantasia}</Muted></div>}
                    </div>
                </div>
            ),
        },
        {
            key: 'tipoPessoa',
            header: 'Tipo',
            sortKey: 'tipoPessoa',
            render: (c) => (c.tipoPessoa === 'PESSOA_JURIDICA'
                ? <Badge $tone="info"><FaBuilding /> PJ</Badge>
                : <Badge $tone="neutral"><FaUser /> PF</Badge>),
        },
        { key: 'documento', header: 'CPF / CNPJ', sortKey: 'documento', render: (c) => (c.documento ? formatDocumento(c.documento) : <Muted>—</Muted>) },
        { key: 'telefone', header: 'Telefone', sortKey: 'telefone', render: (c) => (c.telefone ? formatPhone(c.telefone) : <Muted>—</Muted>) },
        { key: 'cidade', header: 'Cidade', render: (c) => (c.endereco ? `${c.endereco.cidade}/${c.endereco.uf}` : <Muted>—</Muted>) },
        { key: 'usinas', header: 'Usinas', sortKey: 'usinas', render: (c) => (c._count.plants > 0 ? <Badge $tone="success"><TbSolarPanel2 /> {c._count.plants}</Badge> : <Muted>—</Muted>) },
        { key: 'contratos', header: 'Contratos', sortKey: 'contratos', render: (c) => (c._count.contratos > 0 ? c._count.contratos : <Muted>—</Muted>) },
        {
            key: 'acoes',
            header: '',
            width: 130,
            render: (c) => (
                <RowActions
                    onVer={() => navigate(`/clientes/${c.id}`)}
                    onEditar={() => navigate(`/clientes/${c.id}/editar`)}
                    onExcluir={() => setExcluindo(c)}
                />
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaUsers}
                tone="blue"
                title="Clientes"
                subtitle="Pessoas físicas e jurídicas atendidas pela JPL."
                actions={<Button icon={<FaPlus />} onClick={() => navigate('/clientes/novo')}>Novo cliente</Button>}
            />

            <StatGrid>
                <StatCard icon={FaUsers} tom="blue" rotulo="Clientes" valor={totalGeral.data?.meta?.total ?? 0} detalhe="cadastrados" ativo={tipoPessoa === ''} onClick={() => { setTipoPessoa(''); setPage(1); }} delay={0} />
                <StatCard icon={FaUser} tom="teal" rotulo="Pessoas físicas" valor={totalPf.data?.meta?.total ?? 0} detalhe="PF" ativo={tipoPessoa === 'PESSOA_FISICA'} onClick={() => { setTipoPessoa('PESSOA_FISICA'); setPage(1); }} delay={60} />
                <StatCard icon={FaBuilding} tom="purple" rotulo="Empresas" valor={totalPj.data?.meta?.total ?? 0} detalhe="PJ" ativo={tipoPessoa === 'PESSOA_JURIDICA'} onClick={() => { setTipoPessoa('PESSOA_JURIDICA'); setPage(1); }} delay={120} />
            </StatGrid>

            <FiltersBar>
                <FilterInput
                    label="Buscar"
                    placeholder="Nome, CPF/CNPJ, e-mail ou telefone"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                />
                <FilterSelect
                    label="Tipo"
                    options={tipoPessoaOptions}
                    value={tipoPessoa}
                    onChange={(event) => { setTipoPessoa(event.target.value); setPage(1); }}
                />
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
                        onRowClick={(cliente) => navigate(`/clientes/${cliente.id}`)}
                        emptyTitle="Nenhum cliente encontrado"
                        emptyDescription="Ajuste os filtros ou cadastre um novo cliente."
                    />
                    <PaginationBar meta={data?.meta} onPageChange={setPage} label={isFetching ? 'atualizando…' : 'clientes'} />
                </>
            )}

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir cliente"
                message={`Excluir "${excluindo?.nome ?? ''}"? Clientes com usinas, contratos ou lançamentos não podem ser excluídos.`}
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />
        </Page>
    );
}
