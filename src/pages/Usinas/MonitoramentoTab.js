import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBolt, FaCalendarDay, FaCalendarAlt, FaChartArea, FaCheckCircle, FaClock, FaExclamationTriangle, FaFilePdf, FaLeaf, FaMicrochip, FaSyncAlt, FaTachometerAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { anoAtual, dataHoraBr, isoBr } from '../../utils/datas';
import Graphic from '../../components/Graphic';
import { openFileInTab, usinasApi } from '../../api/resources';
import { Badge, Button, Card, EmptyState, ErrorBlock, FilterInput, Grid, IconChip, KeyValue, LoadingBlock, Muted, PaginationBar, Row, SectionTitle, StatCard, StatGrid, tokens } from '../../ui';

const { colors } = tokens;

const CHART_TYPES = [
    { id: 'time', label: 'Dia', icon: FaClock },
    { id: 'day', label: 'Mês', icon: FaCalendarDay },
    { id: 'mouth', label: 'Ano', icon: FaCalendarAlt },
    { id: 'year', label: 'Total', icon: FaChartArea },
];

const Segmentos = styled.div`
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    background: ${colors.neutralBg};
    border-radius: 12px;

    button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 14px;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: ${colors.muted};
        font-weight: 700;
        font-size: 0.88rem;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
    }

    button[aria-pressed='true'] {
        background: ${colors.surface};
        color: ${colors.text};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
`;

const Ocorrencia = styled.article`
    display: flex;
    gap: 14px;
    padding: 14px 16px;
    margin-bottom: 10px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.warning};
    border-radius: 12px;

    .corpo {
        flex: 1;
        min-width: 0;
    }

    .evento {
        font-weight: 700;
    }

    .meta {
        margin-top: 4px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.82rem;
        color: ${colors.muted};
    }

    .solucao {
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        background: ${colors.surfaceAlt};
        font-size: 0.86rem;
        color: ${colors.text};
    }
`;

// Formato do parâmetro de data que cada tipo de gráfico espera do back-end.
function chartDateParam(type, date) {
    const [ano, mes] = isoBr(date).split('-');
    if (type === 'year' || type === 'mouth') return ano;
    if (type === 'day') return `${ano}-${Number(mes)}`;
    return isoBr(date);
}

function extractSeries(response, type, deviceTypeName) {
    const chart = response?.chart;
    if (!chart) return [];

    if (type === 'time') {
        return deviceTypeName === 'tlx' ? chart.charts?.ppv ?? [] : chart.pac ?? [];
    }

    return deviceTypeName === 'tlx' ? chart.charts?.energy ?? [] : chart.energy ?? [];
}

const kwh = (value) => (value === undefined || value === null ? null : Number(value));

// Os portais devolvem datas em formatos diferentes: ISO, "2026-10-13 15:43:11" ou epoch (em segundos ou ms).
function formatDateTime(value) {
    if (value === undefined || value === null || value === '') return '';

    let date;

    if (typeof value === 'number' || /^\d{9,13}$/.test(String(value))) {
        const epoch = Number(value);
        date = new Date(epoch < 1e11 ? epoch * 1000 : epoch);
    } else {
        // "2026-10-13 15:43:11" não tem fuso: trata como horário local, sem converter.
        const local = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(String(value));
        date = new Date(local ? String(value).replace(' ', 'T') : value);
    }

    return Number.isNaN(date.getTime()) ? String(value) : dataHoraBr(date);
}

/** Aba de monitoramento: leitura ao vivo do portal, gráficos de geração e ocorrências do inversor. */
export default function MonitoramentoTab({ usina }) {
    const [chartType, setChartType] = useState('time');
    const [chartDate, setChartDate] = useState(new Date());
    const [errorYear, setErrorYear] = useState(anoAtual());
    const [errorPage, setErrorPage] = useState(1);
    const [downloading, setDownloading] = useState(false);

    const monitoramento = useQuery({
        queryKey: ['usina-monitoramento', usina.id],
        queryFn: () => usinasApi.monitoramento(usina.id),
        staleTime: 60 * 1000,
        retry: false,
    });

    const data = monitoramento.data;
    const plantId = data?.plantData?.id;
    const deviceTypeName = data?.deviceSN?.deviceTypeName;
    const deviceSN = data?.deviceSN?.alias;

    const chart = useQuery({
        queryKey: ['usina-geracao', usina.id, chartType, chartDateParam(chartType, chartDate)],
        queryFn: () => usinasApi.geracao(usina.id, {
            data: chartDateParam(chartType, chartDate),
            tipo: chartType,
            plantId,
            deviceTypeName,
            deviceSN,
        }),
        enabled: Boolean(plantId && deviceTypeName && deviceSN),
        retry: false,
    });

    const erros = useQuery({
        queryKey: ['usina-erros', usina.id, errorYear],
        queryFn: () => usinasApi.erros(usina.id, { ano: errorYear, plantId }),
        enabled: Boolean(plantId),
        retry: false,
    });

    if (monitoramento.isLoading) {
        return <LoadingBlock label="Consultando o portal do fabricante… pode levar alguns segundos." />;
    }

    if (monitoramento.error) {
        return <ErrorBlock message={errorMessage(monitoramento.error)} onRetry={monitoramento.refetch} />;
    }

    const initialSeries = deviceTypeName === 'tlx' ? data.chart?.charts?.ppv : data.chart?.pac;
    const series = chart.data ? extractSeries(chart.data, chartType, deviceTypeName) : chartType === 'time' ? initialSeries ?? [] : [];

    const errorLog = erros.data?.errorLog ?? data.errorLog ?? [];
    const pageSize = 5;
    const errorTotalPages = Math.max(1, Math.ceil(errorLog.length / pageSize));
    const errorRows = errorLog.slice((errorPage - 1) * pageSize, errorPage * pageSize);

    const downloadReport = async () => {
        setDownloading(true);
        try {
            await openFileInTab(
                () => usinasApi.relatorio(usina.id, anoAtual()),
                `relatorio-${usina.code}.pdf`,
                'Gerando relatório…',
            );
        } catch (err) {
            toast.error(errorMessage(err, 'Não foi possível gerar o relatório.'));
        } finally {
            setDownloading(false);
        }
    };

    const hoje = kwh(data.totalData?.eToday);
    const mes = kwh(data.totalData?.eMonth);
    const total = kwh(data.totalData?.eTotal);

    return (
        <>
            <StatGrid>
                <StatCard icon={FaBolt} tom="orange" rotulo="Hoje" valor={hoje ?? '—'} formato={(n) => `${n.toFixed(1)} kWh`} detalhe="gerados até agora" delay={0} />
                <StatCard icon={FaCalendarAlt} tom="teal" rotulo="No mês" valor={mes ?? '—'} formato={(n) => `${Math.round(n).toLocaleString('pt-BR')} kWh`} detalhe={`estimado ${usina.estimatedGeneration} kWh`} delay={60} />
                <StatCard icon={FaLeaf} tom="green" rotulo="Acumulado" valor={total ?? '—'} formato={(n) => `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MWh`} detalhe="desde a instalação" delay={120} />
                <StatCard icon={FaTachometerAlt} tom="blue" rotulo="Potência agora" valor={data.deviceSN?.pac !== undefined ? Number(data.deviceSN.pac) : '—'} formato={(n) => `${Math.round(n)} W`} detalhe={`nominal ${data.deviceSN?.nominalPower ?? '—'}`} delay={180} />
            </StatGrid>

            <Card>
                <SectionTitle
                    icon={FaMicrochip}
                    tom="purple"
                    aside={
                        <Row>
                            <Button size="sm" variant="secondary" icon={<FaSyncAlt />} loading={monitoramento.isFetching} onClick={() => monitoramento.refetch()}>Atualizar</Button>
                            <Button size="sm" variant="secondary" icon={<FaFilePdf />} loading={downloading} onClick={downloadReport}>Relatório PDF</Button>
                        </Row>
                    }
                >
                    Equipamento no portal
                </SectionTitle>
                <Grid $cols={4}>
                    <KeyValue label="Nome no portal">{data.deviceSN?.plantName}</KeyValue>
                    <KeyValue label="Datalogger">{data.deviceSN?.datalogSn}</KeyValue>
                    <KeyValue label="Inversor (série)">{data.deviceSN?.alias}</KeyValue>
                    <KeyValue label="Última atualização">{formatDateTime(data.deviceSN?.lastUpdateTime)}</KeyValue>
                </Grid>
            </Card>

            <Card>
                <SectionTitle icon={FaChartArea} tom="blue">Geração</SectionTitle>
                <Row $justify="space-between" style={{ marginBottom: 14 }}>
                    <Segmentos role="group" aria-label="Período do gráfico">
                        {CHART_TYPES.map((type) => {
                            const Icone = type.icon;
                            return (
                                <button key={type.id} type="button" aria-pressed={chartType === type.id} onClick={() => setChartType(type.id)}>
                                    <Icone /> {type.label}
                                </button>
                            );
                        })}
                    </Segmentos>

                    {chartType !== 'year' && (
                        <div style={{ width: 200 }}>
                            <FilterInput
                                label="Período"
                                type={chartType === 'time' ? 'date' : chartType === 'day' ? 'month' : 'number'}
                                value={
                                    chartType === 'time'
                                        ? isoBr(chartDate)
                                        : chartType === 'day'
                                            ? isoBr(chartDate).slice(0, 7)
                                            : isoBr(chartDate).slice(0, 4)
                                }
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if (!value) return;
                                    const next = chartType === 'mouth' ? new Date(`${value}-01-01T12:00:00-03:00`) : new Date(`${value.length === 7 ? `${value}-01` : value}T12:00:00-03:00`);
                                    if (!Number.isNaN(next.getTime())) setChartDate(next);
                                }}
                            />
                        </div>
                    )}
                </Row>

                {chart.isFetching ? (
                    <LoadingBlock label="Carregando gráfico…" />
                ) : series.length > 0 ? (
                    <div style={{ width: '100%', height: 420 }}>
                        <Graphic powerData={series} type={chartType} inverter={usina.inversor} estimated={usina.estimatedGeneration} chartDate={chartDate} />
                    </div>
                ) : (
                    <EmptyState
                        icon={FaChartArea}
                        title="Sem geração no período"
                        description={chart.error ? errorMessage(chart.error) : 'O portal não trouxe geração para este período.'}
                    />
                )}
            </Card>

            <Card>
                <SectionTitle
                    icon={FaExclamationTriangle}
                    tom="orange"
                    aside={
                        <div style={{ width: 110 }}>
                            <FilterInput
                                label="Ano"
                                type="number"
                                value={errorYear}
                                onChange={(event) => { setErrorYear(Number(event.target.value) || anoAtual()); setErrorPage(1); }}
                            />
                        </div>
                    }
                >
                    Ocorrências do inversor
                </SectionTitle>

                {erros.isFetching ? (
                    <LoadingBlock label="Consultando ocorrências…" />
                ) : errorRows.length === 0 ? (
                    <EmptyState icon={FaCheckCircle} title="Nenhuma ocorrência no período" description="O inversor não registrou alarmes neste ano." />
                ) : (
                    <>
                        {errorRows.map((row) => (
                            <Ocorrencia key={`${row.time}-${row.eventId}-${row.sn}`}>
                                <IconChip $soft $tone="orange" $size={40}><FaExclamationTriangle /></IconChip>
                                <div className="corpo">
                                    <div className="evento">{row.eventName || `Evento ${row.eventId}`}</div>
                                    <div className="meta">
                                        <Badge $tone="warning">{formatDateTime(row.time)}</Badge>
                                        {row.sn && <span>Dispositivo {row.sn}</span>}
                                    </div>
                                    {row.solution && <div className="solucao"><Muted>Solução sugerida:</Muted> {row.solution}</div>}
                                </div>
                            </Ocorrencia>
                        ))}
                        <PaginationBar
                            meta={{ page: errorPage, pageSize, total: errorLog.length, totalPages: errorTotalPages }}
                            onPageChange={setErrorPage}
                            label="ocorrências"
                        />
                    </>
                )}
            </Card>
        </>
    );
}
