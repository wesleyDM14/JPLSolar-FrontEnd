import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaPiggyBank, FaWater } from 'react-icons/fa';
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Card, DataTable, ErrorBlock, LoadingBlock, Muted, Page, PageHeader, SectionTitle, StatCard, StatGrid, tokens, tooltipTema } from '../../ui';
import { ExportButtons, PeriodoFiltro, periodoDoAno } from './comuns';
import { brl, mesCurto, mesLabel } from './format';
import MovimentosDoFluxo from './MovimentosDoFluxo';

const { colors } = tokens;

const eixoMil = (valor) => (Math.abs(valor) >= 1000 ? `${Math.round(valor / 1000)} mil` : valor);

/** Fluxo de caixa mês a mês: previsto (por vencimento) x realizado (por pagamento) e saldo acumulado. */
export default function FluxoCaixa() {
    const [periodo, setPeriodo] = useState(periodoDoAno);
    const [mes, setMes] = useState('');

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'fluxo', periodo],
        queryFn: () => financeiroApi.fluxoCaixa(periodo),
    });

    const meses = (data?.meses ?? []).map((mes) => ({ ...mes, rotulo: mesCurto(mes.mes) }));
    const totais = data?.totais;
    const saldoFinal = meses.length ? meses[meses.length - 1].saldoAcumulado : 0;
    const previstoLiquido = totais ? totais.previstoReceber - totais.previstoPagar : 0;
    const realizadoLiquido = totais ? totais.realizadoReceber - totais.realizadoPagar : 0;

    return (
        <Page>
            <PageHeader icon={FaWater} tone="blue" title="Fluxo de caixa" subtitle="Entradas e saídas por mês: previsto (vencimentos) e realizado (pagamentos)." />

            <PeriodoFiltro de={periodo.de} ate={periodo.ate} onChange={(novo) => { setPeriodo(novo); setMes(''); }} extra={<ExportButtons tipo="fluxo-caixa" params={periodo} />} />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <>
                    <StatGrid>
                        <StatCard icon={FaArrowDown} tom="green" rotulo="Entradas previstas" valor={totais.previstoReceber} formato={brl} detalhe={`${brl(totais.realizadoReceber)} já recebido`} delay={0} />
                        <StatCard icon={FaArrowUp} tom="red" rotulo="Saídas previstas" valor={totais.previstoPagar} formato={brl} detalhe={`${brl(totais.realizadoPagar)} já pago`} delay={60} />
                        <StatCard icon={FaBalanceScale} tom={previstoLiquido >= 0 ? 'teal' : 'orange'} rotulo="Resultado previsto" valor={previstoLiquido} formato={brl} detalhe={`realizado: ${brl(realizadoLiquido)}`} delay={120} />
                        <StatCard icon={FaPiggyBank} tom="blue" rotulo="Saldo ao fim do período" valor={saldoFinal} formato={brl} detalhe="considerando só o realizado" delay={180} />
                    </StatGrid>

                    <Card>
                        <SectionTitle icon={FaWater} tom="blue">Entradas, saídas e saldo</SectionTitle>
                        <div style={{ width: '100%', height: 340 }}>
                            <ResponsiveContainer>
                                <ComposedChart data={meses} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8E24AA" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#8E24AA" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="rotulo" />
                                    <YAxis tickFormatter={eixoMil} />
                                    <Tooltip {...tooltipTema} formatter={(valor) => brl(valor)} />
                                    <Legend />
                                    <Bar dataKey="previstoReceber" name="A receber (previsto)" fill="#64B5F6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="realizadoReceber" name="Recebido" fill="#43A047" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="previstoPagar" name="A pagar (previsto)" fill="#FFB74D" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="realizadoPagar" name="Pago" fill="#E53935" radius={[4, 4, 0, 0]} />
                                    <Area type="monotone" dataKey="saldoAcumulado" name="Saldo acumulado" stroke="#8E24AA" strokeWidth={2.5} fill="url(#saldoGrad)" />
                                    <Line type="monotone" dataKey="resultadoRealizado" name="Resultado do mês" stroke="#F9A825" strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <DataTable
                        rows={[...meses, { mes: 'total', total: true }]}
                        rowKey={(linha) => linha.mes}
                        onRowClick={(linha) => !linha.total && setMes(linha.mes === mes ? '' : linha.mes)}
                        emptyTitle="Sem movimentações no período"
                        columns={[
                            { key: 'mes', header: 'Mês', render: (l) => (l.total ? <strong>Total</strong> : mesLabel(l.mes)) },
                            { key: 'pr', header: 'A receber', render: (l) => brl(l.total ? totais.previstoReceber : l.previstoReceber) },
                            { key: 'pp', header: 'A pagar', render: (l) => brl(l.total ? totais.previstoPagar : l.previstoPagar) },
                            { key: 'rr', header: 'Recebido', render: (l) => <span style={{ color: colors.success }}>{brl(l.total ? totais.realizadoReceber : l.realizadoReceber)}</span> },
                            { key: 'rp', header: 'Pago', render: (l) => <span style={{ color: colors.danger }}>{brl(l.total ? totais.realizadoPagar : l.realizadoPagar)}</span> },
                            {
                                key: 'res',
                                header: 'Resultado',
                                render: (l) => {
                                    const valor = l.total ? realizadoLiquido : l.resultadoRealizado;
                                    return <strong style={{ color: valor >= 0 ? colors.success : colors.danger }}>{brl(valor)}</strong>;
                                },
                            },
                            { key: 'saldo', header: 'Saldo acumulado', render: (l) => (l.total ? '' : brl(l.saldoAcumulado)) },
                        ]}
                    />
                    <Muted>Clique em um mês para ver quem pagou e quem recebeu nele.</Muted>

                    <MovimentosDoFluxo periodo={periodo} mes={mes} onMes={setMes} />
                </>
            )}
        </Page>
    );
}
