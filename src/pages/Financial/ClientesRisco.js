import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FaCoins, FaExclamationTriangle, FaFire, FaShieldAlt, FaUserClock } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Avatar, Badge, Button, DataTable, ErrorBlock, LoadingBlock, Muted, Page, PageHeader, StatCard, StatGrid, tokens } from '../../ui';
import { formatDocumento } from '../../utils/masks';
import ClienteDialog from './ClienteDialog';
import { ExportButtons } from './comuns';
import { brl } from './format';

const { colors } = tokens;

// Score de 0 a 1000: quanto maior, melhor. Cada faixa de score corresponde a uma classe de risco.
const CLASSES = {
    BAIXO: { rotulo: 'Baixo', tom: 'success', cor: '#2E7D32', icone: FaShieldAlt, grad: 'green', faixa: '700 a 1000' },
    MEDIO: { rotulo: 'Médio', tom: 'info', cor: '#F9A825', icone: FaUserClock, grad: 'blue', faixa: '500 a 699' },
    ALTO: { rotulo: 'Alto', tom: 'warning', cor: '#E65100', icone: FaExclamationTriangle, grad: 'orange', faixa: '300 a 499' },
    CRITICO: { rotulo: 'Crítico', tom: 'danger', cor: '#C62828', icone: FaFire, grad: 'red', faixa: '0 a 299' },
};

const CONFIANCA = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };

const Medidor = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 190px;

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
        width: 40px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
`;

const ORDENACOES = {
    score: (a, b) => a.score - b.score,
    valorEmRisco: (a, b) => a.valorEmRisco - b.valorEmRisco,
    emAberto: (a, b) => a.emAberto - b.emAberto,
    vencido: (a, b) => a.vencido - b.vencido,
    maiorAtrasoDias: (a, b) => a.maiorAtrasoDias - b.maiorAtrasoDias,
    jurosPagos: (a, b) => a.jurosPagos - b.jurosPagos,
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
};

/** Score dos clientes (0 a 1000, quanto maior melhor) e o valor que está em risco em cada carteira. */
export default function ClientesRisco() {
    const [classe, setClasse] = useState('');
    const [clienteId, setClienteId] = useState(null);
    const [sort, setSort] = useState({ field: 'score', direction: 'asc' });

    const { data, isLoading, error, refetch } = useQuery({ queryKey: ['financeiro', 'risco'], queryFn: financeiroApi.clientesRisco });

    const lista = useMemo(() => {
        const base = (data?.clientes ?? []).filter((c) => !classe || c.classe === classe);
        const comparar = ORDENACOES[sort.field] ?? ORDENACOES.score;
        return [...base].sort((a, b) => (sort.direction === 'asc' ? comparar(a, b) : comparar(b, a)));
    }, [data, classe, sort]);

    const resumo = (id) => data?.resumo.find((r) => r.classe === id) ?? { clientes: 0, exposicao: 0, valorEmRisco: 0 };

    const alternarOrdem = (campo) =>
        setSort((atual) => (atual.field === campo ? { field: campo, direction: atual.direction === 'asc' ? 'desc' : 'asc' } : { field: campo, direction: campo === 'nome' || campo === 'score' ? 'asc' : 'desc' }));

    return (
        <Page>
            <PageHeader
                icon={FaExclamationTriangle}
                tone="orange"
                title="Score dos clientes"
                subtitle="Nota de 0 a 1000: quanto maior, melhor pagador. A lista começa pelos de menor score."
                actions={<ExportButtons tipo="clientes-risco" params={{}} />}
            />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <>
                    <StatGrid>
                        {['CRITICO', 'ALTO', 'MEDIO', 'BAIXO'].map((id, indice) => {
                            const info = CLASSES[id];
                            return (
                                <StatCard
                                    key={id}
                                    icon={info.icone}
                                    tom={info.grad}
                                    rotulo={`Risco ${info.rotulo.toLowerCase()}`}
                                    valor={resumo(id).clientes}
                                    detalhe={`score ${info.faixa} · ${brl(resumo(id).exposicao)} em aberto`}
                                    ativo={classe === id}
                                    onClick={() => setClasse(classe === id ? '' : id)}
                                    delay={indice * 60}
                                />
                            );
                        })}
                        <StatCard icon={FaCoins} tom="purple" rotulo="Valor em risco" valor={data?.valorEmRiscoTotal ?? 0} formato={brl} detalhe="estimado pelo score" delay={240} />
                    </StatGrid>

                    <p style={{ margin: '0 0 12px' }}>
                        <Muted>
                            O score considera o atraso atual, quanto do saldo já venceu, o histórico de parcelas pagas com atraso e o atraso médio; pagar em dia soma pontos.
                            O valor em risco aplica a probabilidade estimada de calote ao saldo em aberto.
                        </Muted>
                    </p>

                    <DataTable
                        rows={lista}
                        rowKey={(c) => c.clienteId}
                        onRowClick={(c) => setClienteId(c.clienteId)}
                        sort={sort}
                        onSort={alternarOrdem}
                        emptyTitle="Nenhum cliente nesta faixa"
                        emptyDescription="Não há clientes com atraso ou saldo em aberto nesta faixa."
                        columns={[
                            {
                                key: 'nome',
                                header: 'Cliente',
                                sortKey: 'nome',
                                minWidth: 260,
                                render: (c) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar nome={c.nome} size={36} />
                                        <div style={{ lineHeight: 1.35 }}>
                                            <strong style={{ fontWeight: 600 }}>{c.nome}</strong>
                                            {c.documento && <div><Muted style={{ whiteSpace: 'nowrap' }}>{formatDocumento(c.documento)}</Muted></div>}
                                            {c.motivos?.[0] && <div><Muted style={{ fontSize: '0.78rem' }} title={c.motivos.join('\n')}>{c.motivos[0]}</Muted></div>}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'score',
                                header: 'Score',
                                sortKey: 'score',
                                render: (c) => {
                                    const info = CLASSES[c.classe];
                                    return (
                                        <div>
                                            <Medidor title={`Confiança do cálculo: ${CONFIANCA[c.confianca] ?? c.confianca}`}>
                                                <strong style={{ color: info.cor }}>{c.score}</strong>
                                                <div className="trilho"><div className="barra" style={{ width: `${c.score / 10}%`, background: info.cor }} /></div>
                                                <Badge $tone={info.tom}>{info.rotulo}</Badge>
                                            </Medidor>
                                            {c.confianca === 'BAIXA' && <Muted style={{ fontSize: '0.75rem' }}>pouco histórico</Muted>}
                                        </div>
                                    );
                                },
                            },
                            { key: 'risco', header: 'Em risco', sortKey: 'valorEmRisco', nowrap: true, render: (c) => <strong>{brl(c.valorEmRisco)}</strong> },
                            { key: 'aberto', header: 'Em aberto', sortKey: 'emAberto', nowrap: true, render: (c) => brl(c.emAberto) },
                            {
                                key: 'vencido',
                                header: 'Vencido',
                                sortKey: 'vencido',
                                nowrap: true,
                                render: (c) => (c.vencido > 0 ? <strong style={{ color: colors.danger }}>{brl(c.vencido)}</strong> : <Muted>—</Muted>),
                            },
                            {
                                key: 'atraso',
                                header: 'Maior atraso',
                                sortKey: 'maiorAtrasoDias',
                                nowrap: true,
                                render: (c) => (c.maiorAtrasoDias > 0 ? `${c.maiorAtrasoDias} dias · ${c.parcelasVencidas} parc.` : <Muted>—</Muted>),
                            },
                            {
                                key: 'historico',
                                header: 'Histórico',
                                nowrap: true,
                                render: (c) => (c.parcelasPagas > 0 ? `${c.pagasComAtraso}/${c.parcelasPagas} pagas com atraso` : <Muted>sem pagamentos</Muted>),
                            },
                            { key: 'juros', header: 'Juros pagos', sortKey: 'jurosPagos', nowrap: true, render: (c) => (c.jurosPagos > 0 ? brl(c.jurosPagos) : <Muted>—</Muted>) },
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
