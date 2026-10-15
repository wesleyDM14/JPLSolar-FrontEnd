import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBell, FaBroom, FaCheck, FaCheckDouble, FaEnvelope, FaEnvelopeOpen, FaMoneyBillWave, FaSolarPanel, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { notificacoesApi } from '../../api/resources';
import PushNotificacoes from '../../components/PushNotificacoes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
    Badge,
    Button,
    ConfirmDialog,
    Dialog,
    EmptyState,
    ErrorBlock,
    FilterInput,
    IconChip,
    LoadingBlock,
    Page,
    PageHeader,
    PaginationBar,
    Reveal,
    StatCard,
    StatGrid,
    tokens,
} from '../../ui';
import { destinoNotificacao, horaCurta, infoNotificacao, rotuloDoDia } from '../../utils/notificacoes';
import { tempoDesde } from '../../utils/usinaStatus';

const { colors } = tokens;

const Filtros = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 16px;

    .busca {
        flex: 1 1 260px;
        min-width: 0;
    }
`;

const Chips = styled.div`
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    background: ${colors.neutralBg};
    border-radius: 12px;
`;

const Chip = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border: 0;
    border-radius: 9px;
    background: ${({ $ativo }) => ($ativo ? colors.surface : 'transparent')};
    box-shadow: ${({ $ativo }) => ($ativo ? '0 1px 4px rgba(0,0,0,0.12)' : 'none')};
    color: ${({ $ativo }) => ($ativo ? colors.text : colors.muted)};
    font-weight: ${({ $ativo }) => ($ativo ? 700 : 600)};
    font-size: 0.88rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
`;

const Dia = styled.h3`
    margin: 22px 0 10px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${colors.muted};
    text-transform: capitalize;
`;

const Cartao = styled.article`
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px 16px;
    margin-bottom: 10px;
    background: ${({ $nova }) => ($nova ? colors.surface : colors.surface)};
    border: 1px solid ${colors.border};
    ${({ $nova }) => $nova && 'box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-danger) 35%, transparent), var(--c-shadow);'}
    border-left: 4px solid ${({ $cor }) => $cor};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};
    transition: box-shadow 0.15s, transform 0.15s;
    opacity: ${({ $resolvida }) => ($resolvida ? 0.78 : 1)};

    &:hover {
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.09);
        transform: translateY(-1px);
    }

    cursor: pointer;

    &:focus-visible {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
    }

    .corpo {
        flex: 1;
        min-width: 0;
    }

    .mensagem {
        font-weight: ${({ $nova }) => ($nova ? 700 : 500)};
        line-height: 1.45;
        color: ${colors.text};
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 7px;
        font-size: 0.8rem;
        color: ${colors.muted};
    }

    .acoes {
        display: flex;
        gap: 4px;
        flex: none;
    }
`;

const Acao = styled.button`
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: ${({ $perigo, $nao }) => ($perigo ? colors.danger : $nao ? colors.primary : colors.muted)};
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: ${({ $perigo }) => ($perigo ? colors.dangerBg : colors.neutralBg)};
        color: ${({ $perigo }) => ($perigo ? colors.danger : colors.text)};
    }
`;

const Link = styled.button`
    padding: 0;
    border: 0;
    background: none;
    color: ${colors.info};
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

const COR_DO_TOM = { red: '#C62828', orange: '#E65100', green: '#2E7D32', purple: '#6A1B9A', blue: '#1565C0' };
const PAGE_SIZE = 20;

/** Central de notificações: filtros, agrupamento por dia e limpeza em massa. */
export default function NotificationsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [grupo, setGrupo] = useState('');
    const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(1);
    const [confirmacao, setConfirmacao] = useState(null); // 'lidas' | 'todas'
    const [detalhe, setDetalhe] = useState(null);
    const termo = useDebouncedValue(busca);

    const resumo = useQuery({ queryKey: ['notificacoes', 'resumo'], queryFn: notificacoesApi.resumo, refetchInterval: 45 * 1000 });

    const lista = useQuery({
        queryKey: ['notificacoes', 'lista', { grupo, apenasNaoLidas, termo, page }],
        queryFn: () => notificacoesApi.list({ page, pageSize: PAGE_SIZE, grupo, lida: apenasNaoLidas ? 'false' : '', search: termo }),
        placeholderData: (anterior) => anterior,
    });

    const atualizar = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
        queryClient.invalidateQueries({ queryKey: ['notificacoes-contagem'] }),
    ]);

    const alternarLida = useMutation({
        mutationFn: ({ id, isRead }) => notificacoesApi.setRead(id, isRead),
        onSuccess: atualizar,
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const marcarTodas = useMutation({
        mutationFn: notificacoesApi.markAllRead,
        onSuccess: async (resultado) => {
            await atualizar();
            toast.success(resultado.atualizadas > 0 ? `${resultado.atualizadas} notificação(ões) marcadas como lidas.` : 'Nada novo para marcar.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const excluir = useMutation({
        mutationFn: (id) => notificacoesApi.remove(id),
        onSuccess: atualizar,
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const limpar = useMutation({
        mutationFn: (escopo) => notificacoesApi.limpar(escopo),
        onSuccess: async (resultado, escopo) => {
            setConfirmacao(null);
            setPage(1);
            await atualizar();
            toast.success(`${resultado.removidas} notificação(ões) ${escopo === 'todas' ? 'apagadas' : 'lidas removidas'}.`);
        },
        onError: (erro) => {
            setConfirmacao(null);
            toast.error(errorMessage(erro));
        },
    });

    const r = resumo.data;
    const lidas = r ? r.total - r.naoLidas : 0;

    // Clicar no aviso o marca como lido e leva à tela relacionada (ou mostra o texto completo).
    const abrir = (notificacao) => {
        if (!notificacao.isRead) alternarLida.mutate({ id: notificacao.id, isRead: true });
        const destino = destinoNotificacao(notificacao);
        if (destino) navigate(destino);
        else setDetalhe(notificacao);
    };

    // Agrupa por dia mantendo a ordem (já vem da mais recente para a mais antiga).
    const dias = useMemo(() => {
        const mapa = new Map();
        for (const notificacao of lista.data?.data ?? []) {
            const dia = rotuloDoDia(notificacao.createdAt);
            if (!mapa.has(dia)) mapa.set(dia, []);
            mapa.get(dia).push(notificacao);
        }
        return [...mapa.entries()];
    }, [lista.data]);

    const escolher = (novo) => {
        setGrupo(novo);
        setPage(1);
    };

    return (
        <Page>
            <PageHeader
                icon={FaBell}
                tone="red"
                title="Notificações"
                subtitle="Avisos de usinas e do financeiro. Cada problema aparece uma vez e some quando é resolvido."
                actions={
                    <>
                        <Button variant="secondary" icon={<FaCheckDouble />} loading={marcarTodas.isPending} disabled={!r?.naoLidas} onClick={() => marcarTodas.mutate()}>
                            Marcar todas como lidas
                        </Button>
                        <Button variant="secondary" icon={<FaBroom />} disabled={!lidas} onClick={() => setConfirmacao('lidas')}>
                            Limpar lidas
                        </Button>
                        <Button variant="danger" icon={<FaTrash />} disabled={!r?.total} onClick={() => setConfirmacao('todas')}>
                            Apagar tudo
                        </Button>
                    </>
                }
            />

            <StatGrid>
                <StatCard icon={FaEnvelope} tom="red" rotulo="Não lidas" valor={r?.naoLidas ?? 0} detalhe={`${r?.total ?? 0} no total`} ativo={apenasNaoLidas} onClick={() => { setApenasNaoLidas((v) => !v); setPage(1); }} delay={0} />
                <StatCard icon={FaSolarPanel} tom="orange" rotulo="Usinas" valor={r?.usinas ?? 0} detalhe="defeito ou sem comunicação" ativo={grupo === 'usinas'} onClick={() => escolher(grupo === 'usinas' ? '' : 'usinas')} delay={60} />
                <StatCard icon={FaMoneyBillWave} tom="green" rotulo="Financeiro" valor={r?.financeiro ?? 0} detalhe="pagamentos e conferências" ativo={grupo === 'financeiro'} onClick={() => escolher(grupo === 'financeiro' ? '' : 'financeiro')} delay={120} />
                <StatCard icon={FaEnvelopeOpen} tom="gray" rotulo="Já lidas" valor={lidas} detalhe="podem ser limpas" delay={180} />
            </StatGrid>

            <PushNotificacoes />

            <Filtros>
                <Chips role="tablist">
                    {[
                        { id: '', label: 'Todas' },
                        { id: 'usinas', label: 'Usinas' },
                        { id: 'financeiro', label: 'Financeiro' },
                        { id: 'sistema', label: 'Sistema' },
                    ].map((chip) => (
                        <Chip key={chip.id || 'todas'} type="button" role="tab" aria-selected={grupo === chip.id} $ativo={grupo === chip.id} onClick={() => escolher(chip.id)}>
                            {chip.label}
                        </Chip>
                    ))}
                </Chips>
                <div className="busca">
                    <FilterInput label="Buscar" placeholder="Código da usina, cliente ou texto…" value={busca} onChange={(evento) => { setBusca(evento.target.value); setPage(1); }} />
                </div>
            </Filtros>

            {lista.error ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : lista.isLoading ? (
                <LoadingBlock />
            ) : dias.length === 0 ? (
                <EmptyState
                    icon={FaBell}
                    title={apenasNaoLidas || grupo || termo ? 'Nada com esses filtros' : 'Nenhuma notificação'}
                    description={apenasNaoLidas || grupo || termo ? 'Remova os filtros para ver todas.' : 'Quando uma usina ficar offline ou um pagamento chegar, o aviso aparece aqui.'}
                />
            ) : (
                <>
                    {dias.map(([dia, itens]) => (
                        <section key={dia}>
                            <Dia>{dia}</Dia>
                            {itens.map((notificacao, indice) => {
                                const info = infoNotificacao(notificacao);
                                const Icone = info.icon;
                                const destino = destinoNotificacao(notificacao);

                                return (
                                    <Reveal key={notificacao.id} $delay={Math.min(indice, 8) * 30}>
                                        <Cartao
                                            $nova={!notificacao.isRead}
                                            $cor={COR_DO_TOM[info.tom]}
                                            $resolvida={notificacao.resolvida}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => abrir(notificacao)}
                                            onKeyDown={(evento) => evento.key === 'Enter' && abrir(notificacao)}
                                        >
                                            <IconChip $soft $tone={info.tom} $size={42}><Icone /></IconChip>
                                            <div className="corpo">
                                                <div className="mensagem">{notificacao.message}</div>
                                                <div className="meta">
                                                    <Badge $tone={{ red: 'danger', orange: 'warning', green: 'success', purple: 'info', blue: 'info' }[info.tom]}>{info.rotulo}</Badge>
                                                    {notificacao.resolvida && <Badge $tone="success"><FaCheck /> Resolvido</Badge>}
                                                    {notificacao.plant?.client?.nome && <span>{notificacao.plant.client.nome}</span>}
                                                    <span title={new Date(notificacao.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}>{horaCurta(notificacao.createdAt)} · {tempoDesde(notificacao.createdAt)}</span>
                                                    {destino && (
                                                        <Link type="button" onClick={(evento) => { evento.stopPropagation(); abrir(notificacao); }}>
                                                            {notificacao.plant ? `Abrir usina ${notificacao.plant.code}` : 'Abrir financeiro'}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="acoes">
                                                {/* O ícone mostra o estado: carta fechada = não lida, aberta = lida. */}
                                                <Acao
                                                    type="button"
                                                    $nao={!notificacao.isRead}
                                                    title={notificacao.isRead ? 'Lida — clique para marcar como não lida' : 'Não lida — clique para marcar como lida'}
                                                    aria-label={notificacao.isRead ? 'Marcar como não lida' : 'Marcar como lida'}
                                                    onClick={(evento) => {
                                                        evento.stopPropagation();
                                                        alternarLida.mutate({ id: notificacao.id, isRead: !notificacao.isRead });
                                                    }}
                                                >
                                                    {notificacao.isRead ? <FaEnvelopeOpen /> : <FaEnvelope />}
                                                </Acao>
                                                <Acao
                                                    type="button"
                                                    $perigo
                                                    title="Excluir"
                                                    aria-label="Excluir"
                                                    onClick={(evento) => {
                                                        evento.stopPropagation();
                                                        excluir.mutate(notificacao.id);
                                                    }}
                                                >
                                                    <FaTrash />
                                                </Acao>
                                            </div>
                                        </Cartao>
                                    </Reveal>
                                );
                            })}
                        </section>
                    ))}
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label="notificações" />
                </>
            )}

            <Dialog
                open={Boolean(detalhe)}
                title={detalhe ? infoNotificacao(detalhe).rotulo : ''}
                subtitle={detalhe ? new Date(detalhe.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }) : ''}
                width={480}
                onClose={() => setDetalhe(null)}
                footer={<Button variant="secondary" onClick={() => setDetalhe(null)}>Fechar</Button>}
            >
                <p style={{ margin: 0, lineHeight: 1.55 }}>{detalhe?.message}</p>
            </Dialog>

            <ConfirmDialog
                open={Boolean(confirmacao)}
                title={confirmacao === 'todas' ? 'Apagar todas as notificações' : 'Limpar notificações lidas'}
                message={
                    confirmacao === 'todas'
                        ? `Apagar as ${r?.total ?? 0} notificações, inclusive as não lidas? Esta ação não pode ser desfeita.`
                        : `Remover as ${lidas} notificações já lidas? As não lidas continuam aqui.`
                }
                confirmLabel={confirmacao === 'todas' ? 'Apagar tudo' : 'Limpar lidas'}
                danger
                loading={limpar.isPending}
                onConfirm={() => limpar.mutate(confirmacao)}
                onClose={() => setConfirmacao(null)}
            />
        </Page>
    );
}
