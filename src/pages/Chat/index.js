import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaComments, FaPaperPlane, FaPlus, FaTrashAlt, FaUserFriends } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { chatApi } from '../../api/resources';
import { Avatar, Badge, Button, Dialog, EmptyState, ErrorBlock, LoadingBlock, Muted, Page, PageHeader, Tabs, tokens } from '../../ui';
import { tempoDesde } from '../../utils/datas';

const { colors } = tokens;

const Layout = styled.div`
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    height: calc(100vh - 210px);
    min-height: 460px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    box-shadow: ${tokens.shadow};
    overflow: hidden;

    @media (max-width: ${tokens.breakpoint}) {
        grid-template-columns: 1fr;
    }
`;

const Lista = styled.aside`
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid ${colors.border};

    @media (max-width: ${tokens.breakpoint}) {
        display: ${(p) => (p.$escondida ? 'none' : 'flex')};
        border-right: 0;
    }

    .topo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px 14px;
        border-bottom: 1px solid ${colors.border};
    }

    .itens {
        flex: 1;
        overflow-y: auto;
    }
`;

const Item = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    text-align: left;
    color: inherit;
    border: 0;
    border-bottom: 1px solid ${colors.border};
    background: ${(p) => (p.$ativa ? colors.neutralBg : 'transparent')};
    cursor: pointer;

    &:hover {
        background: ${colors.rowHover};
    }

    .texto {
        flex: 1;
        min-width: 0;
    }

    .linha {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: baseline;
    }

    strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .previa {
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.85rem;
        color: ${colors.muted};
    }

    .nova {
        flex: none;
        min-width: 20px;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-align: center;
        color: var(--c-on-primary);
        background: ${colors.primary};
    }
`;

const Conversa = styled.section`
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    @media (max-width: ${tokens.breakpoint}) {
        display: ${(p) => (p.$escondida ? 'none' : 'flex')};
    }

    .cabecalho {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid ${colors.border};
    }

    .voltar {
        display: none;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1.1rem;

        @media (max-width: ${tokens.breakpoint}) {
            display: inline-grid;
        }
    }

    .mensagens {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: ${colors.surfaceAlt};
    }

    .compositor {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        padding: 12px 16px;
        border-top: 1px solid ${colors.border};

        textarea {
            flex: 1;
            resize: none;
            max-height: 140px;
            padding: 10px 12px;
            font: inherit;
            color: ${colors.text};
            background: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: 12px;
        }
    }
`;

const Balao = styled.div`
    align-self: ${(p) => (p.$minha ? 'flex-end' : 'flex-start')};
    max-width: min(560px, 82%);
    padding: 8px 12px;
    border-radius: 14px;
    color: ${(p) => (p.$minha ? 'var(--c-on-primary)' : colors.text)};
    background: ${(p) => (p.$minha ? colors.primary : colors.surface)};
    border: 1px solid ${(p) => (p.$minha ? colors.primary : colors.border)};
    white-space: pre-wrap;
    overflow-wrap: anywhere;

    .autor {
        display: block;
        margin-bottom: 2px;
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.75;
    }

    .hora {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
        font-size: 0.7rem;
        opacity: 0.65;
    }

    .apagar {
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        opacity: 0;
    }

    &:hover .apagar {
        opacity: 1;
    }
`;

const Dia = styled.div`
    align-self: center;
    margin: 8px 0 2px;
    padding: 2px 10px;
    font-size: 0.72rem;
    color: ${colors.muted};
    background: ${colors.neutralBg};
    border-radius: 999px;
`;

const Escolha = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    cursor: pointer;
`;

const hora = (valor) => new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diaDe = (valor) => new Date(valor).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const nomeDe = (u) => u?.name || u?.login || 'Usuário';

export function NovaConversaDialog({ onClose, onAbrir }) {
    const [aba, setAba] = useState('direta');
    const [titulo, setTitulo] = useState('');
    const [marcados, setMarcados] = useState([]);
    const usuarios = useQuery({ queryKey: ['chat', 'usuarios'], queryFn: chatApi.usuarios });

    const abrirDireta = useMutation({
        mutationFn: chatApi.abrirDireta,
        onSuccess: ({ id }) => onAbrir(id),
        onError: (erro) => toast.error(errorMessage(erro)),
    });
    const criarGrupo = useMutation({
        mutationFn: () => chatApi.criarGrupo(titulo.trim(), marcados),
        onSuccess: ({ id }) => onAbrir(id),
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const lista = usuarios.data ?? [];

    return (
        <Dialog
            open
            width={480}
            title="Nova conversa"
            subtitle="Converse com uma pessoa ou crie um grupo."
            onClose={onClose}
            footer={
                aba === 'grupo' ? (
                    <>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button loading={criarGrupo.isPending} disabled={titulo.trim().length < 2 || marcados.length < 2} onClick={() => criarGrupo.mutate()}>Criar grupo</Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                )
            }
        >
            <Tabs
                tabs={[
                    { id: 'direta', label: 'Conversa direta', icon: <FaComments /> },
                    { id: 'grupo', label: 'Grupo', icon: <FaUserFriends /> },
                ]}
                value={aba}
                onChange={setAba}
            />

            {usuarios.isLoading && <LoadingBlock />}
            {usuarios.error && <ErrorBlock message={errorMessage(usuarios.error)} onRetry={usuarios.refetch} />}
            {!usuarios.isLoading && lista.length === 0 && <Muted>Não há outros usuários ativos. Cadastre pessoas em Usuários para conversar.</Muted>}

            {aba === 'direta' &&
                lista.map((u) => (
                    <Item key={u.id} type="button" onClick={() => abrirDireta.mutate(u.id)} disabled={abrirDireta.isPending}>
                        <Avatar nome={nomeDe(u)} src={u.foto} size={36} />
                        <div className="texto">
                            <strong>{nomeDe(u)}</strong>
                            {u.cargo && <div className="previa">{u.cargo}</div>}
                        </div>
                    </Item>
                ))}

            {aba === 'grupo' && (
                <>
                    <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Nome do grupo"
                        maxLength={80}
                        aria-label="Nome do grupo"
                        style={{ width: '100%', padding: '10px 12px', margin: '12px 0 6px', font: 'inherit', color: 'inherit', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, boxSizing: 'border-box' }}
                    />
                    <Muted>Escolha ao menos duas pessoas.</Muted>
                    {lista.map((u) => (
                        <Escolha key={u.id}>
                            <input
                                type="checkbox"
                                checked={marcados.includes(u.id)}
                                onChange={(e) => setMarcados((atual) => (e.target.checked ? [...atual, u.id] : atual.filter((id) => id !== u.id)))}
                            />
                            <Avatar nome={nomeDe(u)} src={u.foto} size={28} />
                            {nomeDe(u)}
                        </Escolha>
                    ))}
                </>
            )}
        </Dialog>
    );
}

/** Chat interno entre os usuários: conversa geral, conversas diretas e grupos. */
export default function Chat() {
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();
    const selecionada = params.get('c');
    const meuId = useSelector((state) => state.session.user?.user?.id ?? state.session.user?.id);
    const [texto, setTexto] = useState('');
    const [novo, setNovo] = useState(false);
    const fim = useRef(null);

    const conversas = useQuery({ queryKey: ['chat', 'conversas'], queryFn: chatApi.conversas, refetchInterval: 6000 });
    const lista = useMemo(() => conversas.data ?? [], [conversas.data]);

    // Sem conversa escolhida, abre a primeira (a geral, quando é a única) em telas largas.
    const atual = lista.find((c) => c.id === selecionada) ?? null;

    const mensagens = useQuery({
        queryKey: ['chat', 'mensagens', selecionada],
        queryFn: () => chatApi.mensagens(selecionada),
        enabled: Boolean(selecionada),
        refetchInterval: 4000,
    });

    const escolher = (id) => setParams(id ? { c: id } : {}, { replace: true });

    // Abrir a conversa e receber mensagens novas com ela aberta conta como leitura.
    const ultimaMensagem = mensagens.data?.[mensagens.data.length - 1]?.id;
    useEffect(() => {
        if (!selecionada || !atual || atual.naoLidas === 0) return;
        chatApi
            .marcarLida(selecionada)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
                queryClient.invalidateQueries({ queryKey: ['chat-nao-lidas'] });
            })
            .catch(() => undefined);
    }, [selecionada, atual, ultimaMensagem, queryClient]);

    // Rola para o fim quando chega mensagem nova.
    useEffect(() => {
        fim.current?.scrollIntoView({ block: 'end' });
    }, [ultimaMensagem, selecionada]);

    const enviar = useMutation({
        mutationFn: (conteudo) => chatApi.enviar(selecionada, conteudo),
        onSuccess: async () => {
            setTexto('');
            await queryClient.invalidateQueries({ queryKey: ['chat', 'mensagens', selecionada] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const apagar = useMutation({
        mutationFn: chatApi.apagar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'mensagens', selecionada] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const submeter = () => {
        const conteudo = texto.trim();
        if (conteudo && !enviar.isPending) enviar.mutate(conteudo);
    };

    let diaAnterior = '';

    return (
        <Page>
            <PageHeader icon={FaComments} tone="dark" title="Chat" subtitle="Converse com quem usa o sistema: conversa geral, direta ou em grupo." />

            {conversas.error ? (
                <ErrorBlock message={errorMessage(conversas.error)} onRetry={conversas.refetch} />
            ) : (
                <Layout>
                    <Lista $escondida={Boolean(selecionada)}>
                        <div className="topo">
                            <strong>Conversas</strong>
                            <Button size="sm" icon={<FaPlus />} onClick={() => setNovo(true)}>Nova</Button>
                        </div>
                        <div className="itens">
                            {conversas.isLoading && <LoadingBlock />}
                            {lista.map((c) => (
                                <Item key={c.id} type="button" $ativa={c.id === selecionada} onClick={() => escolher(c.id)}>
                                    <Avatar nome={c.titulo} src={c.outro?.foto} size={40} />
                                    <div className="texto">
                                        <div className="linha">
                                            <strong>{c.titulo}</strong>
                                            {c.naoLidas > 0 && <span className="nova">{c.naoLidas > 99 ? '99+' : c.naoLidas}</span>}
                                        </div>
                                        <div className="previa">
                                            {c.ultimaMensagem
                                                ? `${c.ultimaMensagem.autor?.id === meuId ? 'Você: ' : c.tipo === 'DIRETA' ? '' : `${nomeDe(c.ultimaMensagem.autor)}: `}${c.ultimaMensagem.texto}`
                                                : c.tipo === 'GERAL' ? 'Todos os usuários do sistema' : 'Sem mensagens ainda'}
                                        </div>
                                    </div>
                                </Item>
                            ))}
                        </div>
                    </Lista>

                    <Conversa $escondida={!selecionada}>
                        {!atual ? (
                            <EmptyState icon={FaComments} title="Escolha uma conversa" description="Selecione uma conversa ao lado ou comece uma nova." />
                        ) : (
                            <>
                                <div className="cabecalho">
                                    <button type="button" className="voltar" aria-label="Voltar às conversas" onClick={() => escolher(null)}><FaArrowLeft /></button>
                                    <Avatar nome={atual.titulo} src={atual.outro?.foto} size={38} />
                                    <div>
                                        <strong>{atual.titulo}</strong>
                                        <div>
                                            <Muted>
                                                {atual.tipo === 'DIRETA'
                                                    ? atual.outro?.cargo || 'Conversa direta'
                                                    : `${atual.participantes.length} pessoa(s)`}
                                            </Muted>
                                        </div>
                                    </div>
                                    {atual.tipo !== 'DIRETA' && <Badge $tone="neutral">{atual.tipo === 'GERAL' ? 'Todos' : 'Grupo'}</Badge>}
                                </div>

                                <div className="mensagens">
                                    {mensagens.isLoading && <LoadingBlock />}
                                    {mensagens.error && <ErrorBlock message={errorMessage(mensagens.error)} onRetry={mensagens.refetch} />}
                                    {mensagens.data?.length === 0 && <Muted style={{ alignSelf: 'center' }}>Nenhuma mensagem ainda. Diga um oi!</Muted>}
                                    {(mensagens.data ?? []).map((m) => {
                                        const dia = diaDe(m.createdAt);
                                        const cabecalhoDia = dia !== diaAnterior ? <Dia key={`d-${m.id}`}>{dia}</Dia> : null;
                                        diaAnterior = dia;
                                        const minha = m.autor?.id === meuId;
                                        return (
                                            <div key={m.id} style={{ display: 'contents' }}>
                                                {cabecalhoDia}
                                                <Balao $minha={minha}>
                                                    {!minha && atual.tipo !== 'DIRETA' && <span className="autor">{nomeDe(m.autor)}</span>}
                                                    {m.texto}
                                                    <span className="hora" title={tempoDesde(m.createdAt)}>
                                                        {minha && (
                                                            <button type="button" className="apagar" title="Apagar mensagem" aria-label="Apagar mensagem" onClick={() => apagar.mutate(m.id)}>
                                                                <FaTrashAlt />
                                                            </button>
                                                        )}
                                                        {hora(m.createdAt)}
                                                    </span>
                                                </Balao>
                                            </div>
                                        );
                                    })}
                                    <div ref={fim} />
                                </div>

                                <div className="compositor">
                                    <textarea
                                        rows={1}
                                        value={texto}
                                        maxLength={4000}
                                        placeholder="Escreva uma mensagem… (Enter envia, Shift+Enter quebra a linha)"
                                        aria-label="Mensagem"
                                        onChange={(e) => setTexto(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                submeter();
                                            }
                                        }}
                                    />
                                    <Button icon={<FaPaperPlane />} loading={enviar.isPending} disabled={!texto.trim()} onClick={submeter}>Enviar</Button>
                                </div>
                            </>
                        )}
                    </Conversa>
                </Layout>
            )}

            {novo && (
                <NovaConversaDialog
                    onClose={() => setNovo(false)}
                    onAbrir={(id) => {
                        setNovo(false);
                        queryClient.invalidateQueries({ queryKey: ['chat', 'conversas'] });
                        escolher(id);
                    }}
                />
            )}
        </Page>
    );
}
