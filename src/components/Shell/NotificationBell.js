import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { notificacoesApi } from '../../api/resources';
import { IconChip, pulse, tokens } from '../../ui';
import { destinoNotificacao, infoNotificacao } from '../../utils/notificacoes';
import { tempoDesde } from '../../utils/usinaStatus';

const { colors } = tokens;

const abre = keyframes`
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Wrapper = styled.div`
    position: relative;
`;

const Botao = styled.button`
    position: relative;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: ${({ $aberto }) => ($aberto ? colors.neutralBg : 'transparent')};
    color: ${colors.text};
    font-size: 19px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: ${colors.neutralBg};
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
    }
`;

const Selo = styled.span`
    position: absolute;
    top: 2px;
    right: 1px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: ${colors.primary};
    color: #fff;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 18px;
    text-align: center;
    ${({ $novo }) => $novo && css`animation: ${pulse} 1.8s 3;`}
`;

const Painel = styled.div`
    position: absolute;
    right: 0;
    top: 48px;
    width: min(400px, calc(100vw - 24px));
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    z-index: 60;
    animation: ${abre} 0.14s ease-out;

    @media (max-width: 640px) {
        position: fixed;
        top: 64px;
        right: 12px;
        left: 12px;
        width: auto;
    }
`;

const Cabecalho = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid ${colors.border};

    strong {
        font-size: 1rem;
    }

    button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: ${colors.info};
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;

        &:hover {
            background: ${colors.infoBg};
        }
    }
`;

const Lista = styled.div`
    max-height: 420px;
    overflow-y: auto;
`;

const Item = styled.button`
    display: flex;
    gap: 12px;
    align-items: flex-start;
    width: 100%;
    padding: 12px 16px;
    border: 0;
    border-bottom: 1px solid ${colors.border};
    background: ${({ $nova }) => ($nova ? colors.dangerBg : colors.surface)};
    text-align: left;
    cursor: pointer;
    color: ${colors.text};

    &:hover {
        background: ${colors.background};
    }

    .texto {
        min-width: 0;
        flex: 1;
        font-size: 0.88rem;
        line-height: 1.4;
        font-weight: ${({ $nova }) => ($nova ? 700 : 500)};
    }

    .quando {
        display: block;
        margin-top: 2px;
        font-size: 0.76rem;
        font-weight: 500;
        color: ${colors.muted};
    }

    .ponto {
        flex: none;
        width: 9px;
        height: 9px;
        margin-top: 6px;
        border-radius: 50%;
        background: ${({ $nova }) => ($nova ? colors.primary : 'transparent')};
    }
`;

const Rodape = styled.button`
    width: 100%;
    padding: 12px;
    border: 0;
    background: ${colors.background};
    color: ${colors.text};
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: ${colors.neutralBg};
    }
`;

const Vazio = styled.div`
    padding: 34px 16px;
    text-align: center;
    color: ${colors.muted};
`;

/** Sino da barra superior: contador, prévia das últimas notificações e atalho para a central. */
export default function NotificationBell() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const raiz = useRef(null);
    const [aberto, setAberto] = useState(false);

    const contagem = useQuery({
        queryKey: ['notificacoes-contagem'],
        queryFn: notificacoesApi.count,
        refetchInterval: 45 * 1000,
    });
    const naoLidas = contagem.data?.count ?? 0;

    const recentes = useQuery({
        queryKey: ['notificacoes', 'recentes'],
        queryFn: () => notificacoesApi.list({ page: 1, pageSize: 7 }),
        enabled: aberto,
    });

    const atualizar = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
        queryClient.invalidateQueries({ queryKey: ['notificacoes-contagem'] }),
    ]);

    const marcarTodas = useMutation({ mutationFn: notificacoesApi.markAllRead, onSuccess: atualizar });
    const marcarUma = useMutation({ mutationFn: (id) => notificacoesApi.setRead(id, true), onSuccess: atualizar });

    useEffect(() => {
        if (!aberto) return undefined;
        const fora = (evento) => raiz.current && !raiz.current.contains(evento.target) && setAberto(false);
        const esc = (evento) => evento.key === 'Escape' && setAberto(false);
        document.addEventListener('mousedown', fora);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', fora);
            document.removeEventListener('keydown', esc);
        };
    }, [aberto]);

    const abrir = (notificacao) => {
        if (!notificacao.isRead) marcarUma.mutate(notificacao.id);
        setAberto(false);
        navigate(destinoNotificacao(notificacao) ?? '/notificacoes');
    };

    return (
        <Wrapper ref={raiz}>
            <Botao
                type="button"
                $aberto={aberto}
                aria-label={`Notificações${naoLidas ? `: ${naoLidas} não lidas` : ''}`}
                aria-expanded={aberto}
                onClick={() => setAberto((valor) => !valor)}
            >
                <FaBell />
                {naoLidas > 0 && <Selo $novo>{naoLidas > 99 ? '99+' : naoLidas}</Selo>}
            </Botao>

            {aberto && (
                <Painel role="dialog" aria-label="Notificações">
                    <Cabecalho>
                        <strong>Notificações</strong>
                        {naoLidas > 0 && (
                            <button type="button" onClick={() => marcarTodas.mutate()}>
                                <FaCheckDouble /> Marcar todas como lidas
                            </button>
                        )}
                    </Cabecalho>

                    <Lista>
                        {recentes.isLoading && <Vazio>Carregando…</Vazio>}
                        {!recentes.isLoading && (recentes.data?.data ?? []).length === 0 && <Vazio>Tudo em dia. Nenhuma notificação.</Vazio>}
                        {(recentes.data?.data ?? []).map((notificacao) => {
                            const info = infoNotificacao(notificacao);
                            const Icone = info.icon;
                            return (
                                <Item key={notificacao.id} type="button" $nova={!notificacao.isRead} onClick={() => abrir(notificacao)}>
                                    <IconChip $soft $tone={info.tom} $size={36}><Icone /></IconChip>
                                    <span className="texto">
                                        {notificacao.message}
                                        <span className="quando">
                                            {notificacao.plant?.client?.nome ? `${notificacao.plant.client.nome} · ` : ''}
                                            {tempoDesde(notificacao.createdAt)}
                                        </span>
                                    </span>
                                    <span className="ponto" />
                                </Item>
                            );
                        })}
                    </Lista>

                    <Rodape type="button" onClick={() => { setAberto(false); navigate('/notificacoes'); }}>
                        Abrir central de notificações
                    </Rodape>
                </Painel>
            )}
        </Wrapper>
    );
}
