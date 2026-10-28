import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBellSlash, FaComments, FaExpandAlt, FaPaperPlane, FaPlus, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { errorMessage } from '../../api/client';
import { chatApi } from '../../api/resources';
import { useChatTempoReal } from '../../hooks/useChatTempoReal';
import { NovaConversaDialog } from '../../pages/Chat';
import { Avatar, tokens } from '../../ui';

const { colors } = tokens;

const abrir = keyframes`
    from { opacity: 0; transform: translateY(14px) scale(0.97); }
    to { opacity: 1; transform: none; }
`;

const pulso = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(45, 226, 240, 0.55); }
    70% { box-shadow: 0 0 0 14px rgba(45, 226, 240, 0); }
    100% { box-shadow: 0 0 0 0 rgba(45, 226, 240, 0); }
`;

const Botao = styled.button`
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 60;
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(45, 226, 240, 0.45);
    border-radius: 50%;
    color: #2de2f0;
    font-size: 24px;
    cursor: pointer;
    background: radial-gradient(circle at 30% 25%, #0b4380, #011b36 75%);
    box-shadow: 0 10px 28px rgba(1, 27, 54, 0.45), 0 0 18px rgba(45, 226, 240, 0.28);
    transition: transform 0.15s;
    ${(p) => p.$novo && `animation: ${pulso} 1.8s ease-out infinite;`}

    &:hover { transform: translateY(-2px) scale(1.04); }
    &:focus-visible { outline: 3px solid #2de2f0; outline-offset: 3px; }

    .contador {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: 800;
        color: #fff;
        background: #e53935;
        border: 2px solid #011b36;
        border-radius: 999px;
    }

    @media (max-width: 600px) {
        right: 14px;
        bottom: 14px;
    }
`;

const Painel = styled.section`
    position: fixed;
    right: 22px;
    bottom: 94px;
    z-index: 60;
    width: min(390px, calc(100vw - 28px));
    height: min(580px, calc(100vh - 120px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: ${colors.text};
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(1, 27, 54, 0.4), 0 0 0 1px rgba(45, 226, 240, 0.12);
    animation: ${abrir} 0.18s ease-out;

    @media (max-width: 600px) {
        right: 7px;
        bottom: 84px;
        height: calc(100vh - 100px);
    }

    header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        color: #eaf6ff;
        background: linear-gradient(135deg, #011b36, #05305f);
    }

    header strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    header button {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 8px;
        color: inherit;
        background: rgba(255, 255, 255, 0.08);
        cursor: pointer;
    }
    header button:hover { background: rgba(45, 226, 240, 0.22); }

    .corpo { flex: 1; min-height: 0; overflow-y: auto; }

    .rodape-aviso {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 8px 14px;
        font-size: 0.78rem;
        color: ${colors.muted};
        border-top: 1px solid ${colors.border};
    }
    .rodape-aviso button { border: 0; padding: 0; background: none; color: var(--c-info); text-decoration: underline; cursor: pointer; font: inherit; }
`;

const Linha = styled.button`
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 11px 14px;
    text-align: left;
    color: inherit;
    border: 0;
    border-bottom: 1px solid ${colors.border};
    background: transparent;
    cursor: pointer;

    &:hover { background: ${colors.rowHover}; }
    .texto { flex: 1; min-width: 0; }
    strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .previa { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: ${colors.muted}; }
    .nova { min-width: 20px; padding: 1px 6px; font-size: 0.72rem; font-weight: 800; text-align: center; color: var(--c-on-primary); background: ${colors.primary}; border-radius: 999px; }
`;

const Mensagens = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px;
    background: ${colors.surfaceAlt};
    min-height: 100%;
    box-sizing: border-box;
`;

const Balao = styled.div`
    align-self: ${(p) => (p.$minha ? 'flex-end' : 'flex-start')};
    max-width: 84%;
    padding: 7px 11px;
    font-size: 0.92rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: ${(p) => (p.$minha ? '#011b36' : colors.text)};
    background: ${(p) => (p.$minha ? 'linear-gradient(135deg, #19c9da, #2de2f0)' : colors.surface)};
    border: 1px solid ${(p) => (p.$minha ? 'transparent' : colors.border)};
    border-radius: 14px;

    .autor { display: block; font-size: 0.72rem; font-weight: 800; opacity: 0.75; }
    .hora { display: block; text-align: right; font-size: 0.66rem; opacity: 0.6; }
`;

const Compositor = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-end;
    padding: 10px 12px;
    border-top: 1px solid ${colors.border};

    textarea {
        flex: 1;
        resize: none;
        max-height: 110px;
        padding: 9px 11px;
        font: inherit;
        color: ${colors.text};
        background: ${colors.surface};
        border: 1px solid ${colors.border};
        border-radius: 12px;
    }

    button {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 12px;
        color: var(--c-on-primary);
        background: linear-gradient(135deg, var(--c-primary-2), var(--c-primary));
        cursor: pointer;
    }
    button:disabled { opacity: 0.45; cursor: default; }
`;

const nomeDe = (u) => u?.name || u?.login || 'Usuário';
const hora = (v) => new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// Bipe curto ao chegar mensagem (gerado na hora, sem arquivo de áudio).
function bipe() {
    try {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return;
        const ctx = new Contexto();
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        ganho.gain.setValueAtTime(0.0001, ctx.currentTime);
        ganho.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(ganho).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
        setTimeout(() => ctx.close(), 400);
    } catch {
        // navegador sem áudio liberado: segue sem som
    }
}

/** Chat flutuante: botão no canto da tela, painel com conversas e mensagens em tempo real. */
export default function ChatFlutuante() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { search } = useLocation();
    const meuId = useSelector((state) => state.session.user?.user?.id ?? state.session.user?.id);

    const [aberto, setAberto] = useState(false);
    const [conversaId, setConversaId] = useState(null);
    const [novo, setNovo] = useState(false);
    const [texto, setTexto] = useState('');
    const fim = useRef(null);
    const estado = useRef({ aberto: false, conversaId: null });
    estado.current = { aberto, conversaId };

    const conversas = useQuery({ queryKey: ['chat', 'conversas'], queryFn: chatApi.conversas, refetchInterval: 60_000 });
    const lista = useMemo(() => conversas.data ?? [], [conversas.data]);
    const naoLidas = lista.reduce((soma, c) => soma + c.naoLidas, 0);
    const atual = lista.find((c) => c.id === conversaId) ?? null;

    const mensagens = useQuery({
        queryKey: ['chat', 'mensagens', conversaId],
        queryFn: () => chatApi.mensagens(conversaId),
        enabled: Boolean(conversaId) && aberto,
    });

    // Abre pelo endereço (?chat=<id>), como no aviso push.
    useEffect(() => {
        const id = new URLSearchParams(search).get('chat');
        if (id) {
            setConversaId(id);
            setAberto(true);
        }
    }, [search]);

    const abrirConversa = useCallback((id) => {
        setConversaId(id);
        setAberto(true);
    }, []);

    // Chegada de eventos em tempo real.
    const aoEvento = useCallback(
        (evento) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'mensagens', evento.conversaId] });
            queryClient.invalidateQueries({ queryKey: ['chat-nao-lidas'] });

            const minha = evento.mensagem?.autor?.id === meuId;
            if (minha || evento.tipo !== 'mensagem') return;

            const vendo = estado.current.aberto && estado.current.conversaId === evento.conversaId && !document.hidden;
            if (vendo) return;

            bipe();
            const quem = nomeDe(evento.mensagem.autor);
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                const aviso = new Notification(evento.titulo ?? quem, { body: evento.mensagem.texto.slice(0, 160), icon: '/icon-192.png', tag: `chat:${evento.conversaId}` });
                aviso.onclick = () => {
                    window.focus();
                    abrirConversa(evento.conversaId);
                    aviso.close();
                };
            } else {
                toast.custom(
                    (t) => (
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                abrirConversa(evento.conversaId);
                            }}
                            style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', maxWidth: 340, textAlign: 'left', color: '#eaf6ff', cursor: 'pointer', background: 'linear-gradient(135deg, #011b36, #05305f)', border: '1px solid rgba(45,226,240,0.4)', borderRadius: 14, boxShadow: '0 10px 30px rgba(1,27,54,0.4)', opacity: t.visible ? 1 : 0, transition: 'opacity .2s' }}
                        >
                            <FaComments style={{ color: '#2de2f0', flex: 'none' }} />
                            <span>
                                <strong style={{ display: 'block' }}>{evento.titulo ?? quem}</strong>
                                <span style={{ opacity: 0.85, fontSize: '0.9rem' }}>{evento.mensagem.texto.slice(0, 90)}</span>
                            </span>
                        </button>
                    ),
                    { duration: 6000, position: 'bottom-right' },
                );
            }
        },
        [queryClient, meuId, abrirConversa],
    );
    useChatTempoReal({ ativo: Boolean(meuId), aoEvento });

    // Conversa aberta e visível conta como lida.
    const ultima = mensagens.data?.[mensagens.data.length - 1]?.id;
    useEffect(() => {
        if (!aberto || !conversaId || !atual || atual.naoLidas === 0) return;
        chatApi
            .marcarLida(conversaId)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
                queryClient.invalidateQueries({ queryKey: ['chat-nao-lidas'] });
            })
            .catch(() => undefined);
    }, [aberto, conversaId, atual, ultima, queryClient]);

    useEffect(() => {
        fim.current?.scrollIntoView({ block: 'end' });
    }, [ultima, conversaId, aberto]);

    // Pede permissão para avisos do navegador na primeira vez que o chat é aberto.
    useEffect(() => {
        if (aberto && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => undefined);
    }, [aberto]);

    const enviar = useMutation({
        mutationFn: (conteudo) => chatApi.enviar(conversaId, conteudo),
        onSuccess: async () => {
            setTexto('');
            await queryClient.invalidateQueries({ queryKey: ['chat', 'mensagens', conversaId] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const submeter = () => {
        const conteudo = texto.trim();
        if (conteudo && !enviar.isPending) enviar.mutate(conteudo);
    };

    return (
        <>
            {aberto && (
                <Painel aria-label="Chat">
                    <header>
                        {atual ? (
                            <button type="button" aria-label="Voltar às conversas" onClick={() => setConversaId(null)}><FaArrowLeft /></button>
                        ) : (
                            <FaComments style={{ color: '#2de2f0' }} />
                        )}
                        <strong>{atual ? atual.titulo : 'Chat da equipe'}</strong>
                        {!atual && <button type="button" aria-label="Nova conversa" title="Nova conversa" onClick={() => setNovo(true)}><FaPlus /></button>}
                        <button type="button" aria-label="Abrir em tela cheia" title="Abrir em tela cheia" onClick={() => { setAberto(false); navigate(atual ? `/chat?c=${atual.id}` : '/chat'); }}><FaExpandAlt /></button>
                        <button type="button" aria-label="Fechar chat" onClick={() => setAberto(false)}><FaTimes /></button>
                    </header>

                    <div className="corpo">
                        {!atual && (
                            lista.map((c) => (
                                <Linha key={c.id} type="button" onClick={() => setConversaId(c.id)}>
                                    <Avatar nome={c.titulo} src={c.outro?.foto} size={38} />
                                    <span className="texto">
                                        <strong>{c.titulo}</strong>
                                        <span className="previa">
                                            {c.ultimaMensagem ? `${c.ultimaMensagem.autor?.id === meuId ? 'Você: ' : c.tipo === 'DIRETA' ? '' : `${nomeDe(c.ultimaMensagem.autor)}: `}${c.ultimaMensagem.texto}` : c.tipo === 'GERAL' ? 'Todos da empresa' : 'Sem mensagens ainda'}
                                        </span>
                                    </span>
                                    {c.naoLidas > 0 && <span className="nova">{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
                                </Linha>
                            ))
                        )}

                        {atual && (
                            <Mensagens>
                                {mensagens.data?.length === 0 && <span style={{ alignSelf: 'center', opacity: 0.6, marginTop: 20 }}>Nenhuma mensagem ainda. Diga um oi!</span>}
                                {(mensagens.data ?? []).map((m) => {
                                    const minha = m.autor?.id === meuId;
                                    return (
                                        <Balao key={m.id} $minha={minha}>
                                            {!minha && atual.tipo !== 'DIRETA' && <span className="autor">{nomeDe(m.autor)}</span>}
                                            {m.texto}
                                            <span className="hora">{hora(m.createdAt)}</span>
                                        </Balao>
                                    );
                                })}
                                <div ref={fim} />
                            </Mensagens>
                        )}
                    </div>

                    {atual && (
                        <Compositor>
                            <textarea
                                rows={1}
                                value={texto}
                                maxLength={4000}
                                placeholder="Escreva uma mensagem…"
                                aria-label="Mensagem"
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submeter();
                                    }
                                }}
                            />
                            <button type="button" aria-label="Enviar" disabled={!texto.trim() || enviar.isPending} onClick={submeter}><FaPaperPlane /></button>
                        </Compositor>
                    )}

                    {!atual && 'Notification' in window && Notification.permission === 'denied' && (
                        <div className="rodape-aviso"><FaBellSlash /> Os avisos do navegador estão bloqueados. Libere nas configurações do site para ser avisado com o sistema fechado.</div>
                    )}
                    {!atual && (
                        <div className="rodape-aviso">
                            Quer ser avisado no celular com o sistema fechado?
                            <button type="button" onClick={() => { setAberto(false); navigate('/notificacoes'); }}>Ativar notificações</button>
                        </div>
                    )}
                </Painel>
            )}

            <Botao type="button" $novo={naoLidas > 0 && !aberto} aria-label={naoLidas > 0 ? `Chat: ${naoLidas} mensagem(ns) não lida(s)` : 'Abrir chat'} onClick={() => setAberto((v) => !v)}>
                {aberto ? <FaTimes /> : <FaComments />}
                {naoLidas > 0 && !aberto && <span className="contador">{naoLidas > 99 ? '99+' : naoLidas}</span>}
            </Botao>

            {novo && (
                <NovaConversaDialog
                    onClose={() => setNovo(false)}
                    onAbrir={(id) => {
                        setNovo(false);
                        queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
                        abrirConversa(id);
                    }}
                />
            )}
        </>
    );
}
