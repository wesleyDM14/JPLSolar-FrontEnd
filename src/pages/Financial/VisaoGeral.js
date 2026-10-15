import { useQuery } from '@tanstack/react-query';
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaCalendarCheck, FaPiggyBank } from 'react-icons/fa';
import styled from 'styled-components';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Card, CardTitle, ErrorBlock, Grid, LoadingBlock, Muted, StatCard, StatGrid, tokens, tooltipTema } from '../../ui';
import { formatDate } from '../../utils/masks';
import { brl, mesCurto, parteDe, situacaoInfo } from './format';

const { colors } = tokens;

const Linha = styled.button`
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 10px 6px;
    border: 0;
    border-bottom: 1px solid ${colors.border};
    background: none;
    text-align: left;
    cursor: pointer;
    color: ${colors.text};

    &:hover {
        background: ${colors.background};
    }

    .titulo {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .parte {
        font-size: 0.82rem;
        color: ${colors.muted};
    }

    .valor {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        white-space: nowrap;
    }
`;

function ProximosCard({ titulo, itens, vazio, onOpen }) {
    return (
        <Card>
            <CardTitle>{titulo}</CardTitle>
            {itens.length === 0 ? (
                <p><Muted>{vazio}</Muted></p>
            ) : (
                itens.map((item) => {
                    const situacao = situacaoInfo(item.situacao, item.tipo);
                    return (
                        <Linha key={item.id} type="button" onClick={() => onOpen(item.id)}>
                            <span>
                                {formatDate(item.dataVencimento)}
                                {item.situacao === 'ATRASADO' && <div style={{ color: colors.danger, fontSize: '0.75rem' }}>{item.diasAtraso}d atraso</div>}
                            </span>
                            <span>
                                <div className="titulo">{item.descricao}</div>
                                <div className="parte">{parteDe(item) || '—'}</div>
                            </span>
                            <span className="valor">
                                {brl(item.valorRestante)}
                                <div><Badge $tone={situacao.tone}>{situacao.label}</Badge></div>
                            </span>
                        </Linha>
                    );
                })
            )}
        </Card>
    );
}

export default function VisaoGeral({ onOpenLancamento }) {
    const resumo = useQuery({ queryKey: ['financeiro', 'resumo'], queryFn: financeiroApi.resumo, refetchInterval: 60 * 1000 });
    const fluxo = useQuery({ queryKey: ['financeiro', 'fluxo'], queryFn: () => financeiroApi.fluxoCaixa({}) });

    if (resumo.isLoading) return <LoadingBlock />;
    if (resumo.error) return <ErrorBlock message={errorMessage(resumo.error)} onRetry={resumo.refetch} />;

    const r = resumo.data;
    const meses = (fluxo.data?.meses ?? []).map((mes) => ({ ...mes, rotulo: mesCurto(mes.mes) }));

    return (
        <>
            <StatGrid>
                <StatCard
                    icon={FaArrowDown}
                    tom="green"
                    rotulo="A receber"
                    valor={r.receber.aberto}
                    formato={brl}
                    detalhe={`${r.receber.quantidadeAberta} em aberto · ${brl(r.receber.atrasado)} vencido`}
                    delay={0}
                />
                <StatCard
                    icon={FaArrowUp}
                    tom="red"
                    rotulo="A pagar"
                    valor={r.pagar.aberto}
                    formato={brl}
                    detalhe={`${r.pagar.quantidadeAberta} em aberto · ${brl(r.pagar.atrasado)} vencido`}
                    delay={60}
                />
                <StatCard
                    icon={FaBalanceScale}
                    tom={r.mes.resultado >= 0 ? 'teal' : 'orange'}
                    rotulo="Resultado do mês"
                    valor={r.mes.resultado}
                    formato={brl}
                    detalhe={`${brl(r.mes.recebido)} recebido · ${brl(r.mes.pago)} pago`}
                    delay={120}
                />
                <StatCard icon={FaPiggyBank} tom="blue" rotulo="Saldo das contas" valor={r.saldoContas} formato={brl} detalhe={`Projetado: ${brl(r.saldoProjetado)}`} delay={180} />
                <StatCard
                    icon={FaCalendarCheck}
                    tom="purple"
                    rotulo="Vence em 7 dias"
                    valor={r.receber.proximos7Dias}
                    formato={brl}
                    detalhe={`a pagar: ${brl(r.pagar.proximos7Dias)}`}
                    delay={240}
                />
            </StatGrid>

            <Card>
                <CardTitle>Fluxo de caixa</CardTitle>
                {fluxo.isLoading ? (
                    <LoadingBlock />
                ) : meses.length === 0 ? (
                    <p><Muted>Sem movimentações no período.</Muted></p>
                ) : (
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={meses} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                                <XAxis dataKey="rotulo" />
                                <YAxis tickFormatter={(valor) => (Math.abs(valor) >= 1000 ? `${Math.round(valor / 1000)} mil` : valor)} />
                                <Tooltip {...tooltipTema} formatter={(valor) => brl(valor)} />
                                <Legend />
                                <Bar dataKey="previstoReceber" name="A receber (previsto)" fill="#64B5F6" />
                                <Bar dataKey="realizadoReceber" name="Recebido" fill="#43A047" />
                                <Bar dataKey="previstoPagar" name="A pagar (previsto)" fill="#FFB74D" />
                                <Bar dataKey="realizadoPagar" name="Pago" fill="#E53935" />
                                <Line type="monotone" dataKey="saldoAcumulado" name="Saldo realizado" stroke="#8E24AA" strokeWidth={2.5} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </Card>

            <Grid $cols={2}>
                <ProximosCard titulo="Próximos recebimentos" itens={r.proximosReceber} vazio="Nada a receber em aberto." onOpen={onOpenLancamento} />
                <ProximosCard titulo="Próximos pagamentos" itens={r.proximosPagar} vazio="Nada a pagar em aberto." onOpen={onOpenLancamento} />
            </Grid>

            <Card>
                <CardTitle>Contas</CardTitle>
                {r.contas.length === 0 ? (
                    <p><Muted>Nenhuma conta cadastrada. Cadastre em Cadastros → Contas para ver os saldos.</Muted></p>
                ) : (
                    <Grid $cols={3}>
                        {r.contas.map((conta) => (
                            <div key={conta.id}>
                                <strong>{conta.nome}</strong> {!conta.ativa && <Badge>Inativa</Badge>}
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{brl(conta.saldo)}</div>
                                <Muted>Saldo inicial {brl(conta.saldoInicial)}</Muted>
                            </div>
                        ))}
                    </Grid>
                )}
            </Card>
        </>
    );
}
