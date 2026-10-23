import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { usinasApi } from '../../api/resources';
import { Badge, Button, DataTable, ErrorBlock, FilterInput, FilterSelect, Muted, Page, PageHeader, StatCard, StatGrid } from '../../ui';
import { formatCurrency } from '../../utils/masks';
import { usinaStatus } from '../../utils/usinaStatus';

const PERIODOS = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '14', label: 'Últimos 14 dias' },
    { value: '30', label: 'Últimos 30 dias' },
];

const FAIXAS = [
    { value: '0.75', label: 'Abaixo de 75% da mediana' },
    { value: '0.85', label: 'Abaixo de 85% da mediana' },
    { value: '0.95', label: 'Abaixo de 95% da mediana' },
    { value: '99', label: 'Todas' },
];

const pct = (v) => `${Math.round(v * 100)}%`;
const num = (v, casas = 1) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas });

/** Usinas que geram menos que as outras sob o mesmo sol: candidatas a limpeza, revisão ou conserto. */
export default function Desempenho() {
    const navigate = useNavigate();
    const [dias, setDias] = useState('7');
    const [faixa, setFaixa] = useState('0.85');
    const [tarifa, setTarifa] = useState('0.85');

    const consulta = useQuery({ queryKey: ['usinas', 'desempenho', dias], queryFn: () => usinasApi.desempenho(Number(dias)), staleTime: 5 * 60 * 1000 });
    const dados = consulta.data;
    const limite = Number(faixa);
    const itens = (dados?.itens ?? []).filter((i) => i.relativo < limite);
    const valorKwh = Number(String(tarifa).replace(',', '.')) || 0;
    const perdaDiaria = (dados?.resumo.perdaTotalKwhPorDia ?? 0) * valorKwh;

    const colunas = [
        {
            key: 'usina',
            header: 'Usina',
            minWidth: 220,
            render: (i) => (
                <div>
                    <strong>{i.code}</strong>
                    <div><Muted style={{ fontSize: '0.85rem' }}>{i.cliente}{i.cidade ? ` · ${i.cidade}${i.uf ? `/${i.uf}` : ''}` : ''}</Muted></div>
                </div>
            ),
        },
        { key: 'kwp', header: 'Potência', nowrap: true, render: (i) => `${num(i.potenciaKwp)} kWp` },
        {
            key: 'relativo',
            header: 'Gera em relação à média',
            nowrap: true,
            render: (i) => <Badge $tone={i.relativo < 0.5 ? 'danger' : i.relativo < 0.75 ? 'warning' : 'info'}>{pct(i.relativo)}</Badge>,
        },
        { key: 'rendimento', header: 'kWh/kWp por dia', nowrap: true, render: (i) => num(i.rendimento, 2) },
        { key: 'perda', header: 'Deixa de gerar', nowrap: true, render: (i) => <div><strong>{num(i.perdaKwhPorDia, 0)} kWh/dia</strong><div><Muted style={{ fontSize: '0.82rem' }}>≈ {formatCurrency(i.perdaKwhPorDia * valorKwh)}/dia</Muted></div></div> },
        {
            key: 'status',
            header: 'Portal diz',
            nowrap: true,
            render: (i) => {
                const s = usinaStatus(i.status);
                return <span title={i.diagnostico ?? s.hint}><Badge $tone={s.tone}>{s.label}</Badge></span>;
            },
        },
        { key: 'dias', header: 'Dias avaliados', nowrap: true, render: (i) => i.dias },
    ];

    return (
        <Page>
            <PageHeader
                title="Desempenho das usinas"
                subtitle="Quanto cada usina gera por kWp instalado, comparado com a mediana de todas no mesmo dia. Quem fica bem abaixo, dia após dia, tem algo errado: sujeira, sombra, módulo ou inversor."
                icon={FaChartLine}
                tone="orange"
                actions={<Button variant="secondary" onClick={() => navigate('/usinas')}>Voltar às usinas</Button>}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
                <FilterSelect label="Período" placeholder={null} value={dias} onChange={(e) => setDias(e.target.value)} options={PERIODOS} />
                <FilterSelect label="Mostrar" placeholder={null} value={faixa} onChange={(e) => setFaixa(e.target.value)} options={FAIXAS} />
                <FilterInput label="Preço do kWh (R$)" type="number" step="0.01" min="0" value={tarifa} onChange={(e) => setTarifa(e.target.value)} />
            </div>

            {consulta.isError && <ErrorBlock message={errorMessage(consulta.error)} onRetry={consulta.refetch} />}

            {dados && (
                <StatGrid style={{ marginBottom: 16 }}>
                    <StatCard rotulo="Usinas avaliadas" valor={String(dados.resumo.avaliadas)} detalhe={dados.resumo.semDados ? `${dados.resumo.semDados} sem dados suficientes` : undefined} tom="blue" />
                    <StatCard rotulo="Abaixo de 75%" valor={String(dados.resumo.abaixoDe75)} tom={dados.resumo.abaixoDe75 ? 'red' : 'green'} />
                    <StatCard rotulo="Abaixo de 85%" valor={String(dados.resumo.abaixoDe85)} tom={dados.resumo.abaixoDe85 ? 'orange' : 'green'} />
                    <StatCard rotulo="Energia perdida por dia" valor={`${num(dados.resumo.perdaTotalKwhPorDia, 0)} kWh`} detalhe={`≈ ${formatCurrency(perdaDiaria)} por dia (abaixo de 85%)`} tom="orange" />
                </StatGrid>
            )}

            {!consulta.isError && (
                <DataTable
                    columns={colunas}
                    rows={itens}
                    loading={consulta.isLoading}
                    emptyTitle="Nenhuma usina nesta faixa"
                    emptyDescription="Todas estão gerando dentro do esperado para o período."
                    onRowClick={(i) => navigate(`/usinas/${i.id}`)}
                />
            )}
            {dados && <Muted style={{ display: 'block', marginTop: 12, fontSize: '0.85rem' }}>Mediana da frota: {num(dados.resumo.medianaKwhPorKwp, 2)} kWh por kWp por dia. Dias de chuva forte em toda a região e usinas com menos de 3 dias de dado ficam de fora. Usinas fora do ar aparecem aqui como 0%.</Muted>}
        </Page>
    );
}
