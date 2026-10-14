import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaBolt, FaCalendarAlt, FaChartLine, FaEdit, FaIdCard, FaLeaf, FaSyncAlt, FaTachometerAlt, FaTrashAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { TbSolarPanel2 } from 'react-icons/tb';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usinasApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { Button, Card, CardTitle, ConfirmDialog, ErrorBlock, Grid, IconChip, KeyValue, LoadingBlock, Page, PageHeader, Reveal, StatCard, StatGrid, Tabs, tokens } from '../../ui';
import { inversorLabel } from '../../utils/enums';
import { formatDate } from '../../utils/masks';
import { tempoDesde, usinaStatus } from '../../utils/usinaStatus';
import AcessoPortal from './AcessoPortal';
import MonitoramentoTab from './MonitoramentoTab';

const TOM_FAIXA = {
    success: { bg: 'var(--p-green-bg)', borda: 'color-mix(in srgb, var(--p-green-fg) 45%, transparent)' },
    info: { bg: 'var(--p-blue-bg)', borda: 'color-mix(in srgb, var(--p-blue-fg) 45%, transparent)' },
    warning: { bg: 'var(--p-orange-bg)', borda: 'color-mix(in srgb, var(--p-orange-fg) 45%, transparent)' },
    danger: { bg: 'var(--p-red-bg)', borda: 'color-mix(in srgb, var(--p-red-fg) 45%, transparent)' },
    neutral: { bg: 'var(--p-gray-bg)', borda: 'var(--c-border)' },
};

const EstadoFaixa = styled.section`
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding: 16px 20px;
    margin-bottom: 16px;
    border-radius: 16px;
    background: ${({ $tom }) => (TOM_FAIXA[$tom] ?? TOM_FAIXA.neutral).bg};
    border: 1px solid ${({ $tom }) => (TOM_FAIXA[$tom] ?? TOM_FAIXA.neutral).borda};

    .texto {
        flex: 1;
        min-width: 220px;
    }

    .titulo {
        font-size: 1.25rem;
        font-weight: 800;
        font-family: 'Montserrat', sans-serif;
        color: ${tokens.colors.text};

        small {
            font-size: 0.85rem;
            font-weight: 500;
            color: ${tokens.colors.muted};
        }
    }

    .detalhe {
        margin-top: 2px;
        color: ${tokens.colors.text};
        opacity: 0.8;
    }

    .leitura {
        font-size: 0.85rem;
        color: ${tokens.colors.muted};
        text-align: right;
    }
`;

export default function UsinaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('cadastro');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: usina, isLoading, error, refetch } = useQuery({
        queryKey: ['usina', id],
        queryFn: () => usinasApi.get(id),
    });

    const remove = useMutation({
        mutationFn: () => usinasApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['usinas'] });
            toast.success('Usina excluída.');
            navigate('/usinas');
        },
        onError: (err) => {
            setConfirmDelete(false);
            toast.error(errorMessage(err));
        },
    });

    // Leitura imediata no portal: grava o estado novo e atualiza a tela.
    const atualizar = useMutation({
        mutationFn: () => usinasApi.atualizar(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['usina', id] });
            await queryClient.invalidateQueries({ queryKey: ['usina-monitoramento', id] });
            await queryClient.invalidateQueries({ queryKey: ['usinas'] });
            toast.success('Usina atualizada com a leitura do portal.');
        },
        onError: (err) => toast.error(errorMessage(err, 'Não foi possível atualizar a usina.')),
    });

    if (isLoading) return <Page><LoadingBlock /></Page>;
    if (error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    const status = usinaStatus(usina.statusMonitoramento);

    return (
        <Page>
            <PageHeader
                icon={TbSolarPanel2}
                tone="orange"
                title={`Usina ${usina.code}`}
                subtitle={<Link to={`/clientes/${usina.client.id}`} style={{ color: 'var(--c-info)', fontWeight: 600 }}>{usina.client.nome}</Link>}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => navigate('/usinas')}>Voltar</Button>
                        <Button variant="secondary" icon={<FaSyncAlt />} loading={atualizar.isPending} onClick={() => atualizar.mutate()}>Atualizar agora</Button>
                        <Button variant="secondary" icon={<FaEdit />} onClick={() => navigate(`/usinas/${id}/editar`)}>Editar</Button>
                        <Button variant="danger" icon={<FaTrashAlt />} onClick={() => setConfirmDelete(true)}>Excluir</Button>
                    </>
                }
            />

            <Tabs
                tabs={[{ id: 'cadastro', label: 'Cadastro', icon: <FaIdCard /> }, { id: 'monitoramento', label: 'Monitoramento', icon: <FaChartLine /> }]}
                value={tab}
                onChange={setTab}
            />

            {tab === 'cadastro' && (
                <>
                    {/* Faixa de estado: cor e ícone dizem de relance se a usina está bem. */}
                    <Reveal>
                        <EstadoFaixa $tom={usina.ativa ? status.tone : 'neutral'}>
                            <IconChip $tone={{ success: 'green', info: 'blue', warning: 'orange', danger: 'red', neutral: 'gray' }[usina.ativa ? status.tone : 'neutral']} $size={54}>
                                <TbSolarPanel2 />
                            </IconChip>
                            <div className="texto">
                                <div className="titulo">
                                    {usina.ativa ? status.label : 'Usina inativa'}
                                    {usina.ativa && usina.statusDesde && <small> · {tempoDesde(usina.statusDesde).replace('há ', 'há ')}</small>}
                                </div>
                                <div className="detalhe">
                                    {usina.ativa
                                        ? (status.hint ?? 'Operando normalmente.')
                                        : 'Não é consultada pelo monitoramento.'}
                                    {usina.ativa && !status.ok && usina.ultimoErro ? ` Último erro de leitura: ${usina.ultimoErro}` : ''}
                                </div>
                            </div>
                            <div className="leitura">
                                {usina.ultimaLeituraEm ? `Última leitura ${tempoDesde(usina.ultimaLeituraEm)}` : 'Ainda sem leitura'}
                                {usina.ultimaComunicacaoEm && <div>Inversor comunicou em {new Date(usina.ultimaComunicacaoEm).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}</div>}
                            </div>
                        </EstadoFaixa>
                    </Reveal>

                    <StatGrid>
                        <StatCard icon={FaBolt} tom="orange" rotulo="Gerou hoje" valor={usina.eToday != null ? Number(usina.eToday) : '—'} formato={(n) => `${n.toFixed(1)} kWh`} detalhe="desde o amanhecer" delay={0} />
                        <StatCard icon={FaTachometerAlt} tom="blue" rotulo="Potência agora" valor={usina.potenciaW != null ? Number(usina.potenciaW) : '—'} formato={(n) => `${Math.round(n)} W`} detalhe={`de ${usina.installedPower} kWp instalados`} delay={60} />
                        <StatCard icon={FaCalendarAlt} tom="teal" rotulo="No mês" valor={usina.eMonth != null ? Number(usina.eMonth) : '—'} formato={(n) => `${Math.round(n).toLocaleString('pt-BR')} kWh`} detalhe={`estimado ${usina.estimatedGeneration} kWh/mês`} delay={120} />
                        <StatCard icon={FaLeaf} tom="green" rotulo="Acumulado" valor={usina.eTotal != null ? Number(usina.eTotal) : '—'} formato={(n) => `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MWh`} detalhe="desde a instalação" delay={180} />
                    </StatGrid>

                    <Card>
                        <CardTitle>Instalação</CardTitle>
                        <Grid $cols={3}>
                            <KeyValue label="Instalada em">{formatDate(usina.installationDate)}</KeyValue>
                            <KeyValue label="Local">{usina.local}</KeyValue>
                            <KeyValue label="Cidade / UF">{usina.cidade ? `${usina.cidade}${usina.uf ? ` / ${usina.uf}` : ''}` : ''}</KeyValue>
                            <KeyValue label="Contrato">
                                {usina.contract ? <Link to={`/contratos/${usina.contract.id}`}>{formatDate(usina.contract.dataContrato)}</Link> : null}
                            </KeyValue>
                        </Grid>
                    </Card>

                    <Card>
                        <CardTitle>Equipamentos</CardTitle>
                        <Grid $cols={3}>
                            <KeyValue label="Inversor">{inversorLabel(usina.inversor)}</KeyValue>
                            <KeyValue label="Potência do inversor">{`${usina.inverterPot} kW`}</KeyValue>
                            <span />
                            <KeyValue label="Painel">{usina.panel}</KeyValue>
                            <KeyValue label="Potência do painel">{`${usina.panelPower} W`}</KeyValue>
                            <KeyValue label="Quantidade">{String(usina.numberPanel)}</KeyValue>
                        </Grid>
                    </Card>

                    <AcessoPortal usina={usina} />
                </>
            )}

            {tab === 'monitoramento' && <MonitoramentoTab usina={usina} />}

            <ConfirmDialog
                open={confirmDelete}
                title="Excluir usina"
                message={`Excluir a usina ${usina.code}? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                danger
                loading={remove.isPending}
                onConfirm={() => remove.mutate()}
                onClose={() => setConfirmDelete(false)}
            />
        </Page>
    );
}
