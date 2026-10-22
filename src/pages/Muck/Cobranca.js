import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FaHandHoldingUsd } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { muckApi } from '../../api/resources';
import { Badge, Button, DataTable, ErrorBlock, FilterSelect, Muted, Page, PageHeader, StatCard, StatGrid } from '../../ui';
import { fimDoAno, hojeIso, inicioDoAno } from '../../utils/datas';
import SeletorPeriodo from '../Financial/SeletorPeriodo';
import { brl, horasTexto, SITUACAO_CLIENTE } from './format';

const FILTROS = [
    { value: 'DEVEM', label: 'Com saldo em aberto' },
    { value: 'ATRASADO', label: 'Só em atraso' },
    { value: 'QUITADO', label: 'Quitados' },
];

/** Cobrança dos serviços do munck, cliente a cliente: o que já foi pago e o que está em aberto. */
export default function Cobranca() {
    const navigate = useNavigate();
    const hoje = hojeIso();
    const [periodo, setPeriodo] = useState({ de: '', ate: '' });
    const [filtro, setFiltro] = useState('');

    const consulta = useQuery({ queryKey: ['muck', 'cobranca', periodo], queryFn: () => muckApi.cobranca(periodo), placeholderData: (anterior) => anterior });
    const dados = consulta.data;

    const clientes = (dados?.clientes ?? []).filter((c) => {
        if (filtro === 'DEVEM') return c.situacao !== 'QUITADO';
        if (filtro === 'ATRASADO') return c.situacao === 'ATRASADO';
        if (filtro === 'QUITADO') return c.situacao === 'QUITADO';
        return true;
    });

    const verServicos = (c, situacao) => {
        const params = new URLSearchParams({ clienteId: c.clienteId, de: periodo.de, ate: periodo.ate });
        if (situacao) params.set('situacao', situacao);
        navigate(`/muck/servicos?${params.toString()}`);
    };

    const colunas = [
        {
            key: 'cliente',
            header: 'Cliente',
            minWidth: 220,
            render: (c) => (
                <div>
                    <strong>{c.clienteNome}</strong>
                    <div><Muted style={{ fontSize: '0.85rem' }}>{c.operacoes} {c.operacoes === 1 ? 'serviço' : 'serviços'} · {horasTexto(c.horas)}</Muted></div>
                </div>
            ),
        },
        {
            key: 'situacao',
            header: 'Situação',
            nowrap: true,
            render: (c) => {
                const info = SITUACAO_CLIENTE[c.situacao];
                return <Badge $tone={info.tone}>{info.label}</Badge>;
            },
        },
        { key: 'total', header: 'Total dos serviços', nowrap: true, render: (c) => brl(c.total) },
        { key: 'pago', header: 'Pago', nowrap: true, render: (c) => <strong style={{ color: 'var(--c-success)' }}>{brl(c.pago)}</strong> },
        { key: 'emAberto', header: 'Em aberto', nowrap: true, render: (c) => (c.emAberto > 0 ? <strong>{brl(c.emAberto)}</strong> : '—') },
        { key: 'atrasado', header: 'Em atraso', nowrap: true, render: (c) => (c.atrasado > 0 ? <strong style={{ color: 'var(--c-danger)' }}>{brl(c.atrasado)}</strong> : '—') },
        {
            key: 'acoes',
            header: '',
            nowrap: true,
            render: (c) => (
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); verServicos(c, c.emAberto > 0 ? 'EM_ABERTO' : ''); }}>
                    {c.emAberto > 0 ? 'Ver pendências' : 'Ver serviços'}
                </Button>
            ),
        },
    ];

    return (
        <Page>
            <PageHeader title="Cobrança do munck" subtitle="Situação de cada cliente: o que já foi pago, o que está em aberto e o que está em atraso. A baixa é feita em contas a receber." icon={FaHandHoldingUsd} />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
                <SeletorPeriodo de={periodo.de} ate={periodo.ate} onChange={setPeriodo} modos={['mes', 'ano', 'tudo']} />
                <FilterSelect label="Mostrar" value={filtro} onChange={(e) => setFiltro(e.target.value)} options={FILTROS} placeholder="Todos os clientes" />
                <Button variant="ghost" size="sm" onClick={() => setPeriodo({ de: inicioDoAno(hoje), ate: fimDoAno(hoje) })}>Este ano</Button>
            </div>

            {consulta.isError ? (
                <ErrorBlock message={errorMessage(consulta.error)} onRetry={consulta.refetch} />
            ) : (
                <>
                    {dados && (
                        <StatGrid style={{ marginBottom: 16 }}>
                            <StatCard rotulo="Faturado" valor={brl(dados.totais.faturado)} tom="blue" />
                            <StatCard rotulo="Já recebido" valor={brl(dados.totais.recebido)} detalhe={`${dados.totais.quitados} cliente(s) quitado(s)`} tom="green" />
                            <StatCard rotulo="A receber" valor={brl(dados.totais.emAberto)} detalhe={`${dados.totais.devedores} cliente(s) com saldo`} tom={dados.totais.emAberto > 0 ? 'orange' : 'green'} />
                            <StatCard rotulo="Em atraso" valor={brl(dados.totais.atrasado)} tom={dados.totais.atrasado > 0 ? 'red' : 'green'} />
                        </StatGrid>
                    )}
                    <DataTable
                        columns={colunas}
                        rows={clientes}
                        rowKey={(c) => c.clienteId}
                        loading={consulta.isLoading}
                        emptyTitle="Nenhum cliente nesta lista"
                        emptyDescription="Registre serviços do munck para acompanhar a cobrança."
                        onRowClick={(c) => verServicos(c, '')}
                    />
                </>
            )}
        </Page>
    );
}
