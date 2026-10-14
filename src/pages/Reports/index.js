import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBalanceScale, FaBook, FaChartLine, FaExclamationTriangle, FaEye, FaFilePdf, FaFileInvoiceDollar, FaWater } from 'react-icons/fa';
import { TbSolarPanel2 } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { openFileInTab, usinasApi } from '../../api/resources';
import {
    Avatar,
    Badge,
    Button,
    Card,
    DataTable,
    ErrorBlock,
    FilterInput,
    FilterSelect,
    FiltersBar,
    IconChip,
    Muted,
    Page,
    PageHeader,
    PaginationBar,
    SectionTitle,
    tokens,
} from '../../ui';
import { anoAtual } from '../../utils/datas';
import { inversorLabel, inversorOptions } from '../../utils/enums';

const { colors } = tokens;

const PAGE_SIZE = 15;
const currentYear = anoAtual();
const yearOptions = Array.from({ length: 5 }, (_, index) => ({ value: String(currentYear - index), label: String(currentYear - index) }));

// Atalhos para os relatórios financeiros e contábeis (cada um gera CSV/PDF na própria tela).
const RELATORIOS_FINANCEIROS = [
    { path: '/financeiro/dre', titulo: 'DRE', descricao: 'Resultado por competência ou por caixa, mês a mês.', icon: FaBalanceScale, tom: 'blue' },
    { path: '/financeiro/fluxo', titulo: 'Fluxo de caixa', descricao: 'Entradas, saídas e saldo acumulado, com previsão dos próximos meses.', icon: FaWater, tom: 'teal' },
    { path: '/financeiro/indicadores', titulo: 'Indicadores', descricao: 'Margens, EBITDA, ROI, liquidez e ponto de equilíbrio.', icon: FaChartLine, tom: 'purple' },
    { path: '/financeiro/risco', titulo: 'Clientes de risco', descricao: 'Nota de risco e atrasos por cliente.', icon: FaExclamationTriangle, tom: 'orange' },
    { path: '/financeiro/contabilidade', titulo: 'Contabilidade', descricao: 'Livro caixa, razão e pacote mensal do contador.', icon: FaBook, tom: 'green' },
    { path: '/financeiro/fiscal', titulo: 'Notas fiscais', descricao: 'XML individual ou em lote e envio ao contador.', icon: FaFileInvoiceDollar, tom: 'red' },
];

const Atalhos = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
    margin-bottom: 22px;
`;

const Atalho = styled.button`
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px;
    text-align: left;
    border: 1px solid ${colors.border};
    border-radius: 14px;
    background: ${colors.surface};
    color: ${colors.text};
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

    &:hover {
        transform: translateY(-2px);
        border-color: ${colors.muted};
        box-shadow: ${tokens.shadow};
    }

    .texto strong {
        display: block;
        font-size: 1rem;
    }

    .texto span {
        display: block;
        margin-top: 4px;
        font-size: 0.84rem;
        color: ${colors.muted};
        line-height: 1.35;
    }
`;

/** Central de relatórios: produção por usina (PDF anual) e atalhos para os relatórios financeiros e contábeis. */
export default function ReportsPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ search: '', inversor: '' });
    const [year, setYear] = useState(String(currentYear));
    const [page, setPage] = useState(1);
    const [generating, setGenerating] = useState('');

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['usinas', 'relatorios', filters, page],
        queryFn: () => usinasApi.list({ ...filters, ativa: 'true', page, pageSize: PAGE_SIZE, sort: 'code:asc' }),
        placeholderData: (previous) => previous,
    });

    const setFilter = (name) => (event) => {
        setFilters((current) => ({ ...current, [name]: event.target.value }));
        setPage(1);
    };

    const generate = async (usina) => {
        setGenerating(usina.id);
        try {
            await openFileInTab(() => usinasApi.relatorio(usina.id, Number(year)), `relatorio-${usina.code}-${year}.pdf`, 'Gerando relatório…');
        } catch (err) {
            toast.error(errorMessage(err, 'Não foi possível gerar o relatório.'));
        } finally {
            setGenerating('');
        }
    };

    const columns = [
        {
            key: 'code',
            header: 'Usina',
            render: (u) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconChip $soft $tone="orange" $size={34}><TbSolarPanel2 /></IconChip>
                    <strong>{u.code}</strong>
                </div>
            ),
        },
        {
            key: 'cliente',
            header: 'Cliente',
            render: (u) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar nome={u.client.nome} size={26} />
                    {u.client.nome}
                </div>
            ),
        },
        { key: 'inversor', header: 'Inversor', render: (u) => <Badge $tone="info">{inversorLabel(u.inversor)}</Badge> },
        { key: 'installedPower', header: 'Potência', render: (u) => (u.installedPower ? `${u.installedPower} kWp` : <Muted>—</Muted>) },
        {
            key: 'acoes',
            header: '',
            width: 220,
            render: (u) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={<FaEye />}
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/usinas/${u.id}`);
                        }}
                    >
                        Usina
                    </Button>
                    <Button
                        size="sm"
                        icon={<FaFilePdf />}
                        loading={generating === u.id}
                        disabled={Boolean(generating) && generating !== u.id}
                        onClick={(event) => {
                            event.stopPropagation();
                            generate(u);
                        }}
                    >
                        PDF {year}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaChartLine}
                tone="purple"
                title="Relatórios"
                subtitle="Produção das usinas e relatórios financeiros."
            />

            <SectionTitle icon={FaBalanceScale} tom="blue">Financeiro e contabilidade</SectionTitle>
            <Atalhos>
                {RELATORIOS_FINANCEIROS.map((item) => {
                    const Icone = item.icon;
                    return (
                        <Atalho key={item.path} type="button" onClick={() => navigate(item.path)}>
                            <IconChip $tone={item.tom} $size={44}><Icone /></IconChip>
                            <div className="texto">
                                <strong>{item.titulo}</strong>
                                <span>{item.descricao}</span>
                            </div>
                        </Atalho>
                    );
                })}
            </Atalhos>

            <Card>
                <SectionTitle icon={TbSolarPanel2} tom="orange">Produção por usina</SectionTitle>
                <p style={{ margin: '0 0 14px', color: colors.muted }}>
                    PDF anual com a geração real e a estimada, mês a mês.
                </p>

                <FiltersBar>
                    <FilterInput label="Buscar" placeholder="Código, cliente ou local" value={filters.search} onChange={setFilter('search')} />
                    <FilterSelect label="Inversor" options={inversorOptions} value={filters.inversor} onChange={setFilter('inversor')} />
                    <FilterSelect label="Ano" options={yearOptions} value={year} onChange={(event) => setYear(event.target.value)} placeholder={String(currentYear)} />
                </FiltersBar>

                {error ? (
                    <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            rows={data?.data}
                            loading={isLoading}
                            emptyTitle="Nenhuma usina encontrada"
                            emptyDescription="Ajuste a busca para encontrar a usina."
                        />
                        <PaginationBar meta={data?.meta} onPageChange={setPage} label={isFetching ? 'atualizando…' : 'usinas'} />
                    </>
                )}
            </Card>
        </Page>
    );
}
