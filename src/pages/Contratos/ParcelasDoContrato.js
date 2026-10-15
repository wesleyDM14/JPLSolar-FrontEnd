import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaCheckCircle, FaCoins, FaExclamationTriangle, FaHourglassHalf, FaMoneyBillWave, FaPercentage } from 'react-icons/fa';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, DataTable, ErrorBlock, LoadingBlock, Muted, StatCard, StatGrid } from '../../ui';
import { formatCurrency, formatDate } from '../../utils/masks';
import LancamentoDialog from '../Financial/LancamentoDialog';

const SITUACAO = {
    PAGO: { rotulo: 'Pago', tom: 'success' },
    ABERTO: { rotulo: 'A vencer', tom: 'info' },
    PARCIAL: { rotulo: 'Parcial', tom: 'warning' },
    ATRASADO: { rotulo: 'Atrasado', tom: 'danger' },
};

const BOLETO = {
    EM_CARTEIRA: 'A vencer',
    VENCIDO: 'Vencido',
    LIQUIDADO: 'Pago',
    BAIXADO: 'Baixado',
    BAIXA_PENDENTE: 'Baixa solicitada',
    REJEITADO: 'Rejeitado',
};

/** Parcelas geradas do contrato: situação, boleto, valor pago e juros/multa recebidos. */
export default function ParcelasDoContrato({ contratoId }) {
    const [aberta, setAberta] = useState(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'contrato', 'parcelas', contratoId],
        queryFn: () => financeiroApi.contratoParcelas(contratoId),
    });

    if (isLoading) return <LoadingBlock />;
    if (error) return <ErrorBlock message={errorMessage(error)} onRetry={refetch} />;

    const { resumo, parcelas } = data;

    if (parcelas.length === 0) {
        return <Muted>Este contrato ainda não tem parcelas geradas. Use “Gerar parcelas” no topo da página.</Muted>;
    }

    return (
        <>
            <StatGrid>
                <StatCard icon={FaMoneyBillWave} tom="blue" rotulo="Contratado" valor={resumo.contratado} formato={formatCurrency} detalhe={`${resumo.quantidade} parcela(s)`} />
                <StatCard icon={FaCheckCircle} tom="green" rotulo="Recebido" valor={resumo.recebido} formato={formatCurrency} detalhe={`${resumo.quitadas} parcela(s) paga(s)`} />
                <StatCard icon={FaHourglassHalf} tom="gray" rotulo="Em aberto" valor={resumo.emAberto} formato={formatCurrency} detalhe={`${resumo.abertas} parcela(s)`} />
                <StatCard
                    icon={FaExclamationTriangle}
                    tom={resumo.atrasadas > 0 ? 'red' : 'gray'}
                    rotulo="Atrasado"
                    valor={resumo.atrasado}
                    formato={formatCurrency}
                    detalhe={`${resumo.atrasadas} parcela(s)`}
                />
                <StatCard icon={FaPercentage} tom="purple" rotulo="Juros e multa" valor={resumo.jurosRecebidos} formato={formatCurrency} detalhe="recebidos além das parcelas" />
                <StatCard icon={FaCoins} tom="teal" rotulo="Total recebido" valor={resumo.totalRecebidoComJuros} formato={formatCurrency} detalhe="parcelas + juros e multa" />
            </StatGrid>

            <DataTable
                rows={parcelas}
                onRowClick={(p) => setAberta(p.id)}
                columns={[
                    {
                        key: 'numero',
                        header: 'Parcela',
                        nowrap: true,
                        render: (p) => <strong>{p.total ? `${p.numero}/${p.total}` : '—'}</strong>,
                    },
                    { key: 'vencimento', header: 'Vencimento', nowrap: true, render: (p) => formatDate(p.dataVencimento) },
                    { key: 'valor', header: 'Valor', nowrap: true, render: (p) => formatCurrency(p.valor) },
                    {
                        key: 'pago',
                        header: 'Pago',
                        nowrap: true,
                        render: (p) =>
                            p.valorPago > 0 ? (
                                <div>
                                    <strong>{formatCurrency(p.valorPago)}</strong>
                                    {p.pagoEm && <div><Muted style={{ fontSize: '0.78rem' }}>em {formatDate(p.pagoEm)}</Muted></div>}
                                </div>
                            ) : (
                                <Muted>—</Muted>
                            ),
                    },
                    { key: 'juros', header: 'Juros e multa', nowrap: true, render: (p) => (p.juros > 0 ? <strong>{formatCurrency(p.juros)}</strong> : <Muted>—</Muted>) },
                    {
                        key: 'situacao',
                        header: 'Situação',
                        nowrap: true,
                        render: (p) => {
                            const info = SITUACAO[p.situacao] ?? { rotulo: p.situacao, tom: 'neutral' };
                            return (
                                <div>
                                    <Badge $tone={info.tom}>{info.rotulo}</Badge>
                                    {p.diasAtraso > 0 && <div><Muted style={{ fontSize: '0.78rem' }}>{p.diasAtraso} dia(s) de atraso</Muted></div>}
                                </div>
                            );
                        },
                    },
                    {
                        key: 'boleto',
                        header: 'Boleto',
                        nowrap: true,
                        render: (p) => (p.boleto ? <span>{BOLETO[p.boleto.situacao] ?? p.boleto.situacao ?? 'Emitido'}</span> : <Muted>sem boleto</Muted>),
                    },
                ]}
            />

            {aberta && <LancamentoDialog id={aberta} onClose={() => setAberta(null)} />}
        </>
    );
}
