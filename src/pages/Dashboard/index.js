import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/resources';
import { errorMessage } from '../../api/client';
import { ErrorBlock, LoadingBlock } from '../../ui';
import { usinaStatus } from '../../utils/usinaStatus';
import {
    Banner,
    BoardFrame,
    BoardRow,
    BoardTitle,
    BoardTop,
    boardColors,
    Clock,
    Columns,
    Counter,
    Counters,
    Layout,
    Section,
    SectionHead,
} from './Board';

const PAGE_SIZE_STACKED = 8; // usinas OK por vez com as listas empilhadas
const PAGE_SIZE_SIDE = 12; // com as listas lado a lado há mais altura útil
const ROTATE_MS = 7000; // tempo até virar para o próximo grupo
const WIDE_QUERY = '(min-width: 1200px)';

// Tela grande = listas lado a lado. Sem matchMedia (testes/SSR) assume tela pequena.
function useIsWide() {
    const getMatch = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(WIDE_QUERY).matches : false);
    const [wide, setWide] = useState(getMatch);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;

        const media = window.matchMedia(WIDE_QUERY);
        const onChange = () => setWide(media.matches);

        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    return wide;
}

// Ordem de gravidade para a lista fixa: alerta, offline, sem leitura.
const severity = (status) => usinaStatus(status).severity;

// Leitura mais velha que isso, em horário de sol, indica que o monitoramento parou.
const LEITURA_VELHA_MIN = 45;

const byCode = (a, b) => a.code.localeCompare(b.code, 'pt-BR', { numeric: true });

function ColumnHeaders({ hideStatusCompact = false }) {
    return (
        <Columns as="div" $hideStatusCompact={hideStatusCompact}>
            <span />
            <span>CÓDIGO</span>
            <span>CLIENTE</span>
            <span>INVERSOR</span>
            <span>GERAÇÃO</span>
            <span>STATUS</span>
        </Columns>
    );
}

/**
 * Painel estilo "quadro de embarque": usinas com problema ficam FIXAS no topo;
 * as que estão operando normalmente ficam rodando em grupos, com as aletas virando a cada troca.
 */
export default function DashboardPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const wide = useIsWide();
    const pageSize = wide ? PAGE_SIZE_SIDE : PAGE_SIZE_STACKED;

    const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardApi.get,
        refetchInterval: 60 * 1000,
    });

    const { atencao, operando } = useMemo(() => {
        const lista = (data?.usinas ?? []).map((usina) => ({ ...usina, statusInfo: usinaStatus(usina.status) }));

        return {
            atencao: lista
                .filter((usina) => !usina.statusInfo.ok)
                .sort((a, b) => severity(a.status) - severity(b.status) || byCode(a, b)),
            operando: lista.filter((usina) => usina.statusInfo.ok).sort(byCode),
        };
    }, [data]);

    const totalPages = Math.max(1, Math.ceil(operando.length / pageSize));

    useEffect(() => {
        if (totalPages <= 1) return undefined;

        const timer = setInterval(() => setPage((current) => (current + 1) % totalPages), ROTATE_MS);
        return () => clearInterval(timer);
    }, [totalPages]);

    // Se a lista encolher (atualização de dados), volta ao início.
    useEffect(() => {
        if (page >= totalPages) setPage(0);
    }, [page, totalPages]);

    const openUsina = useCallback((id) => navigate(`/usinas/${id}`), [navigate]);

    if (isLoading) return <LoadingBlock />;
    if (error) return <ErrorBlock message={errorMessage(error)} onRetry={refetch} />;

    const visiveis = operando.slice(page * pageSize, page * pageSize + pageSize);
    const hora = (valor) => (valor ? new Date(valor).toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }) : '');
    // Mostra a hora da última leitura do monitoramento (não a do carregamento da tela).
    const ultimaLeitura = data.ultimaAtualizacao ? new Date(data.ultimaAtualizacao) : null;
    const leituraVelha = Boolean(
        data.emHorarioDeGeracao && (!ultimaLeitura || (dataUpdatedAt - ultimaLeitura.getTime()) / 60000 > LEITURA_VELHA_MIN),
    );
    const porStatus = data.porStatus ?? {};

    return (
        <BoardFrame>
            <BoardTop>
                <div>
                    <BoardTitle>PAINEL DE USINAS</BoardTitle>
                    <div style={{ color: boardColors.muted, marginTop: 6 }}>JPL SOLAR · {data.atualizando ? 'ATUALIZANDO AGORA…' : ultimaLeitura ? `ÚLTIMA LEITURA ÀS ${hora(ultimaLeitura)}` : 'SEM LEITURAS REGISTRADAS'}
                    </div>
                </div>
                <Counters>
                    <Counter label="USINAS" value={data.totalUsinas} />
                    <Counter label="OPERANDO" value={operando.length} color={boardColors.ok} />
                    <Counter label="ALERTA" value={porStatus.ALERTA ?? 0} color={porStatus.ALERTA ? boardColors.danger : boardColors.ok} />
                    <Counter label="OFFLINE" value={porStatus.OFFLINE ?? 0} color={porStatus.OFFLINE ? boardColors.alert : boardColors.ok} />
                    <Counter
                        label="POTÊNCIA"
                        value={`${Number(data.potenciaInstaladaKwp).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KWP`}
                        color={boardColors.header}
                    />
                </Counters>
                <Clock />
            </BoardTop>

            {leituraVelha && (
                <Banner style={{ color: boardColors.alert }}>
                    {ultimaLeitura ? `LEITURAS DESATUALIZADAS · ÚLTIMA ÀS ${hora(ultimaLeitura)}` : 'NENHUMA LEITURA REGISTRADA'} — VERIFIQUE O MONITORAMENTO AUTOMÁTICO
                </Banner>
            )}

            <Layout>
            <Section $accent={atencao.length ? boardColors.danger : boardColors.ok}>
                <SectionHead $accent={atencao.length ? boardColors.danger : boardColors.ok}>
                    <span>REQUER ATENÇÃO · {atencao.length}</span>
                    <span style={{ color: boardColors.muted, fontWeight: 400 }}>FIXO</span>
                </SectionHead>

                {atencao.length === 0 ? (
                    <Banner>TODAS AS USINAS OPERANDO NORMALMENTE</Banner>
                ) : (
                    <>
                        <ColumnHeaders />
                        <div>
                            {atencao.map((usina, index) => (
                                <BoardRow key={usina.id} usina={usina} status={usina.statusInfo} index={index} animate={false} onOpen={openUsina} />
                            ))}
                        </div>
                    </>
                )}
            </Section>

            <Section $accent={boardColors.ok} $sticky>
                <SectionHead $accent={boardColors.ok}>
                    <span>OPERANDO NORMALMENTE · {operando.length}</span>
                    <span style={{ color: boardColors.muted, fontWeight: 400 }}>
                        GRUPO {operando.length ? page + 1 : 0}/{operando.length ? totalPages : 0}
                    </span>
                </SectionHead>

                {operando.length === 0 ? (
                    <Banner style={{ color: boardColors.muted }}>NENHUMA USINA EM OPERAÇÃO NO MOMENTO</Banner>
                ) : (
                    <>
                        <ColumnHeaders hideStatusCompact />
                        <div>
                            {visiveis.map((usina, index) => (
                                // A chave inclui o grupo: ao trocar de página as linhas remontam e as aletas viram.
                                <BoardRow
                                    key={`${page}-${usina.id}`}
                                    usina={usina}
                                    status={usina.statusInfo}
                                    index={index}
                                    animate
                                    hideStatusCompact
                                    onOpen={openUsina}
                                />
                            ))}
                        </div>
                    </>
                )}
            </Section>
            </Layout>
        </BoardFrame>
    );
}
