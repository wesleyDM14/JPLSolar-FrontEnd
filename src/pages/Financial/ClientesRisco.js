import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FaExclamationTriangle, FaFire, FaShieldAlt, FaUserClock } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Avatar, Badge, Button, DataTable, ErrorBlock, LoadingBlock, Muted, Page, PageHeader, StatCard, StatGrid, tokens } from '../../ui';
import { formatDocumento } from '../../utils/masks';
import ClienteDialog from './ClienteDialog';
import { ExportButtons } from './comuns';
import { brl } from './format';

const { colors } = tokens;

const CLASSES = {
    CRITICO: { rotulo: 'Crítico', tom: 'danger', cor: '#C62828', icone: FaFire, grad: 'red' },
    ALTO: { rotulo: 'Alto', tom: 'warning', cor: '#E65100', icone: FaExclamationTriangle, grad: 'orange' },
    MEDIO: { rotulo: 'Médio', tom: 'info', cor: '#F9A825', icone: FaUserClock, grad: 'blue' },
    BAIXO: { rotulo: 'Baixo', tom: 'success', cor: '#2E7D32', icone: FaShieldAlt, grad: 'green' },
};

const Medidor = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 140px;

    .trilho {
        flex: 1;
        height: 8px;
        border-radius: 6px;
        background: ${colors.neutralBg};
        overflow: hidden;
    }

    .barra {
        height: 100%;
        border-radius: 6px;
        transition: width 0.6s ease;
    }

    strong {
        width: 28px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
`;

/** Ranking de clientes por risco de inadimplência (atrasos atuais e histórico de pagamento). */
export default function ClientesRisco() {
    const [classe, setClasse] = useState('');
    const [clienteId, setClienteId] = useState(null);

    const { data, isLoading, error, refetch } = useQuery({ queryKey: ['financeiro', 'risco'], queryFn: financeiroApi.clientesRisco });

    const lista = useMemo(() => (data?.clientes ?? []).filter((c) => !classe || c.classe === classe), [data, classe]);
    const resumo = (id) => data?.resumo.find((r) => r.classe === id) ?? { clientes: 0, exposicao: 0 };

    return (
        <Page>
            <PageHeader
                icon={FaExclamationTriangle}
                tone="orange"
                title="Clientes de risco"
                subtitle="Clientes com atraso, valor em aberto e prioridade de cobrança."
                actions={<ExportButtons tipo="clientes-risco" params={{}} />}
            />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <>
                    <StatGrid>
                        {Object.entries(CLASSES).map(([id, info], indice) => (
                            <StatCard
                                key={id}
                                icon={info.icone}
                                tom={info.grad}
                                rotulo={`Risco ${info.rotulo.toLowerCase()}`}
                                valor={resumo(id).clientes}
                                detalhe={`${brl(resumo(id).exposicao)} em aberto`}
                                ativo={classe === id}
                                onClick={() => setClasse(classe === id ? '' : id)}
                                delay={indice * 60}
                            />
                        ))}
                    </StatGrid>

                    <p style={{ margin: '0 0 12px' }}>
                        <Muted>
                            A nota vai de 0 a 100 e combina o maior atraso atual, a parcela vencida sobre o total em aberto, a quantidade de parcelas vencidas
                            e o histórico de pagamentos com atraso. Clique em um cliente para ver parcelas, usinas e contratos.
                        </Muted>
                    </p>

                    <DataTable
                        rows={lista}
                        rowKey={(c) => c.clienteId}
                        onRowClick={(c) => setClienteId(c.clienteId)}
                        emptyTitle="Nenhum cliente nesta faixa de risco"
                        emptyDescription="Não há clientes com atraso nesta faixa."
                        columns={[
                            {
                                key: 'nome',
                                header: 'Cliente',
                                render: (c) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar nome={c.nome} size={36} />
                                        <div>
                                            <strong>{c.nome}</strong>
                                            {c.documento && <div><Muted>{formatDocumento(c.documento)}</Muted></div>}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'risco',
                                header: 'Risco',
                                render: (c) => {
                                    const info = CLASSES[c.classe];
                                    return (
                                        <Medidor>
                                            <div className="trilho"><div className="barra" style={{ width: `${c.score}%`, background: info.cor }} /></div>
                                            <strong>{c.score}</strong>
                                            <Badge $tone={info.tom}>{info.rotulo}</Badge>
                                        </Medidor>
                                    );
                                },
                            },
                            { key: 'aberto', header: 'Em aberto', render: (c) => brl(c.emAberto) },
                            { key: 'vencido', header: 'Vencido', render: (c) => (c.vencido > 0 ? <strong style={{ color: colors.danger }}>{brl(c.vencido)}</strong> : <Muted>—</Muted>) },
                            { key: 'parcelas', header: 'Parcelas vencidas', render: (c) => (c.parcelasVencidas > 0 ? c.parcelasVencidas : <Muted>—</Muted>) },
                            { key: 'atraso', header: 'Maior atraso', render: (c) => (c.maiorAtrasoDias > 0 ? `${c.maiorAtrasoDias} dias` : <Muted>—</Muted>) },
                            {
                                key: 'historico',
                                header: 'Histórico',
                                render: (c) => (c.parcelasPagas > 0 ? `${c.pagasComAtraso}/${c.parcelasPagas} pagas com atraso` : <Muted>sem pagamentos</Muted>),
                            },
                            {
                                key: 'acao',
                                header: '',
                                render: (c) => (
                                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setClienteId(c.clienteId); }}>
                                        Ver cliente
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </>
            )}

            {clienteId && <ClienteDialog clienteId={clienteId} onClose={() => setClienteId(null)} />}
        </Page>
    );
}
