import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaBalanceScale, FaChartLine, FaCoins, FaHandHoldingUsd, FaPercentage, FaShieldAlt, FaTint } from 'react-icons/fa';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Card, ErrorBlock, Grid, LoadingBlock, Muted, Page, PageHeader, Reveal, SectionTitle, StatCard, StatGrid, tokens } from '../../ui';
import { ExportButtons, PeriodoFiltro, num, pct, periodoDoAno } from './comuns';
import { brl, mesCurto } from './format';

const { colors } = tokens;

const eixoMil = (valor) => (Math.abs(valor) >= 1000 ? `${Math.round(valor / 1000)} mil` : valor);

const Explicacao = styled.dl`
    margin: 0;
    display: grid;
    gap: 14px;

    dt {
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    dd {
        margin: 3px 0 0;
        color: ${colors.muted};
        font-size: 0.88rem;
        line-height: 1.5;
    }
`;

// Leitura rápida de um indicador: cor conforme esteja saudável, em atenção ou crítico.
function tomMargem(valor, bom, aceitavel) {
    if (valor === null || valor === undefined) return 'gray';
    if (valor >= bom) return 'green';
    if (valor >= aceitavel) return 'orange';
    return 'red';
}

/** Indicadores gerenciais: margens, EBITDA, ROI, liquidez, ponto de equilíbrio, inadimplência e curvas. */
export default function Indicadores() {
    const [periodo, setPeriodo] = useState(periodoDoAno);
    const [regime, setRegime] = useState('competencia');

    const parametros = { ...periodo, regime };
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'indicadores', parametros],
        queryFn: () => financeiroApi.indicadores(parametros),
    });
    const aging = useQuery({ queryKey: ['financeiro', 'aging'], queryFn: financeiroApi.aging });

    const curva = (data?.curva ?? []).map((ponto) => ({ ...ponto, rotulo: mesCurto(ponto.mes) }));
    const equilibrio = data?.pontoEquilibrio.receitaNecessariaMensal;

    return (
        <Page>
            <PageHeader icon={FaChartLine} tone="teal" title="Indicadores financeiros" subtitle="Margens, retorno, liquidez, ponto de equilíbrio e inadimplência." />

            <PeriodoFiltro de={periodo.de} ate={periodo.ate} onChange={setPeriodo} regime={regime} onRegime={setRegime} extra={<ExportButtons tipo="indicadores" params={parametros} />} />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <>
                    <StatGrid>
                        <StatCard icon={FaPercentage} tom={tomMargem(data.margens.bruta, 40, 20)} rotulo="Margem bruta" valor={pct(data.margens.bruta)} detalhe={`lucro bruto ${brl(data.resultado.lucroBruto)}`} delay={0} />
                        <StatCard icon={FaChartLine} tom={tomMargem(data.margens.ebitda, 20, 8)} rotulo="EBITDA" valor={brl(data.resultado.ebitda)} detalhe={`margem EBITDA ${pct(data.margens.ebitda)}`} delay={50} />
                        <StatCard icon={FaCoins} tom={tomMargem(data.margens.liquida, 12, 4)} rotulo="Margem líquida" valor={pct(data.margens.liquida)} detalhe={`lucro líquido ${brl(data.resultado.lucroLiquido)}`} delay={100} />
                        <StatCard icon={FaHandHoldingUsd} tom={tomMargem(data.retorno.roi, 15, 5)} rotulo="ROI do período" valor={pct(data.retorno.roi)} detalhe={`sobre ${brl(data.retorno.baseCusto)} gastos`} delay={150} />
                        <StatCard
                            icon={FaTint}
                            tom={data.liquidez.corrente === null ? 'gray' : data.liquidez.corrente >= 1.2 ? 'green' : data.liquidez.corrente >= 1 ? 'orange' : 'red'}
                            rotulo="Liquidez corrente"
                            valor={num(data.liquidez.corrente)}
                            detalhe={`imediata: ${num(data.liquidez.imediata)}`}
                            delay={200}
                        />
                        <StatCard
                            icon={FaShieldAlt}
                            tom={data.cobranca.inadimplencia === null ? 'gray' : data.cobranca.inadimplencia <= 5 ? 'green' : data.cobranca.inadimplencia <= 15 ? 'orange' : 'red'}
                            rotulo="Inadimplência"
                            valor={pct(data.cobranca.inadimplencia)}
                            detalhe={`${brl(data.cobranca.vencido)} vencido`}
                            delay={250}
                        />
                    </StatGrid>

                    <Grid $cols={2}>
                        <Reveal>
                            <Card>
                                <SectionTitle icon={FaChartLine} tom="blue">Receita × despesas × resultado</SectionTitle>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <ComposedChart data={curva} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="rotulo" />
                                            <YAxis tickFormatter={eixoMil} />
                                            <Tooltip formatter={(v) => brl(v)} />
                                            <Legend />
                                            <Bar dataKey="receita" name="Receita" fill="#43A047" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="despesas" name="Despesas" fill="#E53935" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#1E88E5" strokeWidth={2.5} dot={{ r: 3 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Reveal>

                        <Reveal $delay={60}>
                            <Card>
                                <SectionTitle icon={FaBalanceScale} tom="purple">Curva de resultado acumulado</SectionTitle>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <ComposedChart data={curva} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="acumulado" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8E24AA" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#8E24AA" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="rotulo" />
                                            <YAxis tickFormatter={eixoMil} />
                                            <Tooltip formatter={(v) => brl(v)} />
                                            <ReferenceLine y={0} stroke="#9E9E9E" />
                                            <Area type="monotone" dataKey="resultadoAcumulado" name="Resultado acumulado" stroke="#8E24AA" strokeWidth={2.5} fill="url(#acumulado)" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Reveal>

                        <Reveal $delay={120}>
                            <Card>
                                <SectionTitle icon={FaShieldAlt} tom="orange" aside={data.pontoEquilibrio.margemSeguranca !== null && <Badge $tone={data.pontoEquilibrio.margemSeguranca >= 0 ? 'success' : 'danger'}>Margem de segurança {pct(data.pontoEquilibrio.margemSeguranca)}</Badge>}>
                                    Ponto de equilíbrio
                                </SectionTitle>
                                <div style={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer>
                                        <ComposedChart data={curva} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="rotulo" />
                                            <YAxis tickFormatter={eixoMil} />
                                            <Tooltip formatter={(v) => brl(v)} />
                                            <Legend />
                                            <Bar dataKey="receita" name="Receita do mês" radius={[4, 4, 0, 0]}>
                                                {curva.map((ponto) => (
                                                    <Cell key={ponto.mes} fill={equilibrio !== null && ponto.receita >= equilibrio ? '#43A047' : '#FB8C00'} />
                                                ))}
                                            </Bar>
                                            {equilibrio !== null && equilibrio !== undefined && (
                                                <ReferenceLine y={equilibrio} stroke="#C62828" strokeDasharray="6 4" label={{ value: `Equilíbrio ${brl(equilibrio)}`, position: 'insideTopRight', fill: '#C62828', fontSize: 12 }} />
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                <p style={{ margin: '8px 0 0' }}>
                                    <Muted>
                                        Despesas fixas de {brl(data.pontoEquilibrio.despesasFixasMensais)} por mês e margem de contribuição de {pct(data.margens.contribuicao)}.
                                        Barras verdes passaram do ponto de equilíbrio.
                                    </Muted>
                                </p>
                            </Card>
                        </Reveal>

                        <Reveal $delay={180}>
                            <Card>
                                <SectionTitle icon={FaCoins} tom="green">Curva ABC de clientes</SectionTitle>
                                {data.curvaAbc.length === 0 ? (
                                    <p><Muted>Sem receita de clientes no período.</Muted></p>
                                ) : (
                                    <div style={{ width: '100%', height: 280 }}>
                                        <ResponsiveContainer>
                                            <ComposedChart data={data.curvaAbc.slice(0, 15)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="nome" tickFormatter={(n) => `${String(n).split(' ')[0]}`} interval={0} fontSize={11} />
                                                <YAxis yAxisId="valor" tickFormatter={eixoMil} />
                                                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                                <Tooltip formatter={(v, nome) => (nome === 'Acumulado' ? `${v}%` : brl(v))} />
                                                <Bar yAxisId="valor" dataKey="valor" name="Receita" radius={[4, 4, 0, 0]}>
                                                    {data.curvaAbc.slice(0, 15).map((cliente) => (
                                                        <Cell key={cliente.clienteId} fill={cliente.classe === 'A' ? '#1E88E5' : cliente.classe === 'B' ? '#FB8C00' : '#90A4AE'} />
                                                    ))}
                                                </Bar>
                                                <Line yAxisId="pct" type="monotone" dataKey="acumulado" name="Acumulado" stroke="#C62828" strokeWidth={2} dot={{ r: 3 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Card>
                        </Reveal>
                    </Grid>

                    <Grid $cols={2}>
                        <Card>
                            <SectionTitle icon={FaShieldAlt} tom="red">Envelhecimento das contas a receber</SectionTitle>
                            {aging.data ? (
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {aging.data.receber.faixas.map((faixa) => (
                                        <div key={faixa.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span>{faixa.rotulo} <Muted>({faixa.quantidade})</Muted></span>
                                                <strong>{brl(faixa.valor)}</strong>
                                            </div>
                                            <div style={{ height: 8, borderRadius: 6, background: colors.neutralBg, overflow: 'hidden', marginTop: 4 }}>
                                                <div style={{ width: `${faixa.participacao ?? 0}%`, height: '100%', background: faixa.id === 'a-vencer' ? '#43A047' : faixa.id === '1-30' ? '#FDD835' : faixa.id === '31-60' ? '#FB8C00' : '#E53935', transition: 'width 0.6s' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <LoadingBlock />}
                        </Card>

                        <Card>
                            <SectionTitle icon={FaBalanceScale} tom="gray">Como ler cada indicador</SectionTitle>
                            <Explicacao>
                                <div><dt>Margem bruta</dt><dd>O que sobra da receita líquida depois dos custos diretos (material e mão de obra).</dd></div>
                                <div><dt>EBITDA</dt><dd>Resultado da operação antes de juros, imposto sobre o lucro, depreciação e amortização.</dd></div>
                                <div><dt>ROI</dt><dd>Lucro líquido dividido pelo total gasto no período (custos e despesas).</dd></div>
                                <div><dt>Liquidez corrente</dt><dd>(Saldo das contas + a receber em até 90 dias) ÷ (a pagar em até 90 dias). Acima de 1 significa folga.</dd></div>
                                <div><dt>Ponto de equilíbrio</dt><dd>Receita mensal mínima para cobrir as despesas fixas.</dd></div>
                            </Explicacao>
                        </Card>
                    </Grid>

                    <Card>
                        <SectionTitle icon={FaHandHoldingUsd} tom="blue">Cobrança</SectionTitle>
                        <Grid $cols={3}>
                            <div><Muted>Em aberto a receber</Muted><div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{brl(data.cobranca.emAberto)}</div></div>
                            <div><Muted>Prazo médio de recebimento</Muted><div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{data.cobranca.prazoMedioRecebimentoDias === null ? '—' : `${num(data.cobranca.prazoMedioRecebimentoDias, 1)} dias após o vencimento`}</div></div>
                            <div><Muted>Receita média mensal</Muted><div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{brl(data.retorno.receitaMediaMensal)}</div></div>
                        </Grid>
                    </Card>
                </>
            )}
        </Page>
    );
}
