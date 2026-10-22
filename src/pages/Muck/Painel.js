import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaExclamationTriangle, FaFileInvoiceDollar, FaTruckMoving } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { errorMessage } from '../../api/client';
import { muckApi } from '../../api/resources';
import { Badge, Button, Card, CardTitle, ErrorBlock, FilterSelect, Grid, LoadingBlock, Muted, Page, PageHeader, StatCard, StatGrid, tokens, tooltipTema } from '../../ui';
import { fimDoAno, hojeIso, inicioDoAno } from '../../utils/datas';
import { formatDate } from '../../utils/masks';
import SeletorPeriodo from '../Financial/SeletorPeriodo';
import { brl, horasTexto, mesLabel } from './format';

const { colors } = tokens;

/** Visão geral do caminhão: quanto trabalhou, faturou, recebeu, gastou e o que merece atenção. */
export default function Painel() {
    const navigate = useNavigate();
    const hoje = hojeIso();
    const [periodo, setPeriodo] = useState({ de: inicioDoAno(hoje), ate: fimDoAno(hoje) });
    const [veiculoId, setVeiculoId] = useState('');

    const veiculos = useQuery({ queryKey: ['muck', 'veiculos'], queryFn: muckApi.veiculos });
    const consulta = { ...periodo, veiculoId };
    const painel = useQuery({ queryKey: ['muck', 'painel', consulta], queryFn: () => muckApi.painel(consulta), placeholderData: (anterior) => anterior });

    const p = painel.data;
    const t = p?.totais;
    const meses = (p?.meses ?? []).map((m) => ({ ...m, rotulo: mesLabel(m.mes) }));

    return (
        <Page>
            <PageHeader title="Caminhão munck" subtitle="Serviços por hora, cobrança e manutenção do veículo de trabalho." icon={FaTruckMoving} />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
                <SeletorPeriodo de={periodo.de} ate={periodo.ate} onChange={setPeriodo} modos={['mes', 'ano', 'tudo']} />
                {(veiculos.data ?? []).length > 1 && (
                    <FilterSelect label="Veículo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} options={veiculos.data.map((v) => ({ value: v.id, label: v.nome }))} />
                )}
            </div>

            {painel.isError && <ErrorBlock message={errorMessage(painel.error)} onRetry={painel.refetch} />}
            {painel.isLoading && <LoadingBlock />}

            {p && (
                <>
                    {t.notasAEmitir > 0 && (
                        <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span>
                                <FaFileInvoiceDollar style={{ marginRight: 8 }} />
                                <strong>{t.notasAEmitir}</strong> {t.notasAEmitir === 1 ? 'serviço marcado' : 'serviços marcados'} para nota fiscal que ainda não têm nota.
                            </span>
                            <Button size="sm" onClick={() => navigate('/muck/servicos?nota=A_EMITIR&de=&ate=')}>Revisar e emitir</Button>
                        </Card>
                    )}

                    <StatGrid>
                        <StatCard rotulo="Horas trabalhadas" valor={horasTexto(t.horas)} detalhe={`${t.servicos} serviços${t.emAndamento ? ` · ${t.emAndamento} em andamento` : ''}`} tom="blue" />
                        <StatCard rotulo="Faturado" valor={brl(t.faturado)} tom="blue" />
                        <StatCard rotulo="Recebido" valor={brl(t.recebido)} tom="green" />
                        <StatCard rotulo="A receber" valor={brl(t.aReceber)} tom={t.aReceber > 0 ? 'orange' : 'green'} onClick={() => navigate('/muck/cobranca')} />
                        <StatCard rotulo="Gastos com o caminhão" valor={brl(t.despesas)} tom="red" onClick={() => navigate('/muck/manutencao')} />
                        <StatCard
                            rotulo="Resultado"
                            valor={brl(t.resultado)}
                            detalhe={t.custoMotorista > 0 ? `${brl(t.resultadoComMotorista)} descontando o motorista` : 'o que entrou menos o que gastou'}
                            tom={t.resultado >= 0 ? 'green' : 'red'}
                        />
                    </StatGrid>

                    <Card>
                        <CardTitle>Mês a mês</CardTitle>
                        {meses.length === 0 ? (
                            <p><Muted>Nada lançado neste período.</Muted></p>
                        ) : (
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <ComposedChart data={meses} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                                        <XAxis dataKey="rotulo" />
                                        <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} mil` : v)} />
                                        <Tooltip {...tooltipTema} formatter={(valor, nome) => (nome === 'Horas' ? horasTexto(valor) : brl(valor))} />
                                        <Legend />
                                        <Bar dataKey="faturado" name="Faturado" fill="#43A047" />
                                        <Bar dataKey="despesas" name="Despesas" fill="#E53935" />
                                        <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#8E24AA" strokeWidth={2.5} dot />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>

                    <Grid $cols={2}>
                        <Card>
                            <CardTitle>Revisões do caminhão</CardTitle>
                            {p.revisoes.length === 0 ? (
                                <p><Muted>Nenhuma revisão chegando. Ao registrar uma manutenção, diga quando será a próxima.</Muted></p>
                            ) : (
                                p.revisoes.map((r) => (
                                    <div key={r.manutencaoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                        <div>
                                            <strong>{r.tipo}</strong> <Muted>· {r.veiculo}</Muted>
                                            <div><Muted style={{ fontSize: '0.85rem' }}>{r.motivo}{r.proximaData ? ` (${formatDate(r.proximaData)})` : ''}</Muted></div>
                                        </div>
                                        <Badge $tone={r.situacao === 'VENCIDA' ? 'danger' : 'warning'}>
                                            <FaExclamationTriangle /> {r.situacao === 'VENCIDA' ? 'Vencida' : 'Em breve'}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </Card>

                        <Card>
                            <CardTitle>Para onde vai o dinheiro</CardTitle>
                            {p.despesasPorTipo.length === 0 ? (
                                <p><Muted>Nenhum gasto neste período.</Muted></p>
                            ) : (
                                p.despesasPorTipo.map((d) => (
                                    <div key={d.tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                        <span>{d.tipoNome}</span>
                                        <strong>{brl(d.valor)}</strong>
                                    </div>
                                ))
                            )}
                        </Card>
                    </Grid>
                </>
            )}
        </Page>
    );
}
