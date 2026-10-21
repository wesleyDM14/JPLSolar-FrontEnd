import { useQuery } from '@tanstack/react-query';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaFileInvoiceDollar } from 'react-icons/fa';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import { financeiroApi } from '../../api/resources';
import { Card, Muted, SectionTitle, StatCard, StatGrid, tokens, tooltipTema } from '../../ui';
import { brl, mesCurto, primeiroDiaDoMes, TIPO, ultimoDiaDoMes } from './format';

const { colors } = tokens;

const Graficos = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 16px;

    > section {
        margin-bottom: 0;
        min-width: 0;
    }
`;

const eixoMil = (valor) => (Math.abs(valor) >= 1000 ? `${Math.round(valor / 1000)} mil` : valor);
const curto = (texto, limite = 22) => (texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto);

/**
 * Cartões e gráficos de contas a receber ou a pagar, seguindo os filtros da lista.
 * Clicar num cartão, numa barra do mês ou numa barra de cliente/fornecedor aplica o filtro na lista.
 */
export default function PainelLancamentos({ tipo, params, paramsGraficos, filtros, onFiltrar }) {
    const receber = tipo === TIPO.RECEBER;
    const parte = receber ? 'cliente' : 'fornecedor';

    const resumo = useQuery({
        queryKey: ['financeiro', 'painel', 'resumo', params],
        queryFn: () => financeiroApi.agrupado({ ...params, por: 'situacao' }),
        placeholderData: (anterior) => anterior,
    });
    const porMes = useQuery({
        queryKey: ['financeiro', 'painel', 'mes', paramsGraficos],
        queryFn: () => financeiroApi.agrupado({ ...paramsGraficos, por: 'mes' }),
        placeholderData: (anterior) => anterior,
    });
    const porParte = useQuery({
        queryKey: ['financeiro', 'painel', parte, paramsGraficos],
        queryFn: () => financeiroApi.agrupado({ ...paramsGraficos, por: parte }),
        placeholderData: (anterior) => anterior,
    });

    const total = resumo.data?.total;
    const noPrazo = total ? Math.max(0, total.valorRestante - total.valorAtrasado) : 0;
    const percentualPago = total && total.valor > 0 ? Math.round((total.valorPago / total.valor) * 100) : 0;

    // Janela de 18 meses: 6 para trás e 11 à frente do mês atual.
    const agora = new Date();
    const chaveDoMes = (deslocamento) => {
        const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + deslocamento, 1));
        return d.toISOString().slice(0, 7);
    };
    const [inicioJanela, fimJanela] = [chaveDoMes(-6), chaveDoMes(11)];

    const meses = (porMes.data?.grupos ?? [])
        .filter((g) => /^\d{4}-\d{2}$/.test(g.chave) && g.chave >= inicioJanela && g.chave <= fimJanela)
        .map((g) => ({
            chave: g.chave,
            rotulo: mesCurto(g.chave),
            pago: g.valorPago,
            noPrazo: Math.max(0, g.valorRestante - g.valorAtrasado),
            vencido: g.valorAtrasado,
        }));

    const partes = (porParte.data?.grupos ?? [])
        .filter((g) => g.chave !== '-' && g.valorRestante > 0)
        .sort((a, b) => b.valorRestante - a.valorRestante)
        .slice(0, 8)
        .map((g) => ({ chave: g.chave, nome: g.rotulo, restante: g.valorRestante, vencido: g.valorAtrasado }));

    const situacao = (valor) => () => onFiltrar({ situacao: filtros.situacao === valor ? '' : valor });

    return (
        <>
            <StatGrid>
                <StatCard icon={FaFileInvoiceDollar} tom="blue" rotulo="Total no período" valor={total?.valor ?? 0} formato={brl} detalhe={`${total?.quantidade ?? 0} lançamentos`} delay={0} />
                <StatCard
                    icon={FaCheckCircle}
                    tom="green"
                    rotulo={receber ? 'Recebido' : 'Pago'}
                    valor={total?.valorPago ?? 0}
                    formato={brl}
                    detalhe={`${percentualPago}% do total`}
                    ativo={filtros.situacao === 'PAGO'}
                    onClick={situacao('PAGO')}
                    delay={60}
                />
                <StatCard
                    icon={FaClock}
                    tom="teal"
                    rotulo="A vencer"
                    valor={noPrazo}
                    formato={brl}
                    detalhe="em aberto, no prazo"
                    ativo={filtros.situacao === 'ABERTO'}
                    onClick={situacao('ABERTO')}
                    delay={120}
                />
                <StatCard
                    icon={FaExclamationTriangle}
                    tom="red"
                    rotulo="Vencido"
                    valor={total?.valorAtrasado ?? 0}
                    formato={brl}
                    detalhe={total?.valorAtrasado > 0 ? `${Math.round((total.valorAtrasado / Math.max(total.valorRestante, 1)) * 100)}% do que está em aberto` : 'nada em atraso'}
                    ativo={filtros.situacao === 'ATRASADO'}
                    onClick={situacao('ATRASADO')}
                    delay={180}
                />
            </StatGrid>

            <Graficos>
                <Card>
                    <SectionTitle icon={FaFileInvoiceDollar} tom="blue">Vencimentos por mês (6 atrás, 11 à frente)</SectionTitle>
                    {meses.length === 0 ? (
                        <Muted>Sem lançamentos no período.</Muted>
                    ) : (
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={meses} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="rotulo" interval="preserveStartEnd" />
                                    <YAxis tickFormatter={eixoMil} width={52} />
                                    <Tooltip {...tooltipTema} formatter={(valor) => brl(valor)} />
                                    <Legend />
                                    {['pago', 'noPrazo', 'vencido'].map((campo) => (
                                        <Bar
                                            key={campo}
                                            dataKey={campo}
                                            stackId="mes"
                                            name={{ pago: receber ? 'Recebido' : 'Pago', noPrazo: 'A vencer', vencido: 'Vencido' }[campo]}
                                            fill={{ pago: '#43A047', noPrazo: '#64B5F6', vencido: '#E53935' }[campo]}
                                            cursor="pointer"
                                            onClick={(barra) => onFiltrar({ vencimentoDe: primeiroDiaDoMes(barra.chave), vencimentoAte: ultimoDiaDoMes(barra.chave) })}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                <Card>
                    <SectionTitle icon={FaExclamationTriangle} tom="orange">{receber ? 'Clientes com mais em aberto' : 'Fornecedores com mais em aberto'}</SectionTitle>
                    {partes.length === 0 ? (
                        <Muted>Nada em aberto no período.</Muted>
                    ) : (
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={partes} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={eixoMil} />
                                    <YAxis type="category" dataKey="nome" width={140} tickFormatter={(nome) => curto(nome)} tick={{ fill: colors.text, fontSize: 12 }} />
                                    <Tooltip {...tooltipTema} formatter={(valor, nome) => [brl(valor), nome]} />
                                    <Bar
                                        dataKey="restante"
                                        name="Em aberto"
                                        radius={[0, 4, 4, 0]}
                                        cursor="pointer"
                                        onClick={(barra) => onFiltrar(receber ? { clienteId: barra.chave, clienteNome: barra.nome } : { fornecedorId: barra.chave, fornecedorNome: barra.nome })}
                                    >
                                        {partes.map((p) => <Cell key={p.chave} fill={p.vencido > 0 ? '#E53935' : '#64B5F6'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {partes.length > 0 && <Muted>Em vermelho: tem valor vencido.</Muted>}
                </Card>
            </Graficos>
        </>
    );
}
