import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FaCheckCircle,
    FaChevronRight,
    FaCloudUploadAlt,
    FaDatabase,
    FaDownload,
    FaEdit,
    FaExclamationCircle,
    FaFile,
    FaFileAlt,
    FaFileArchive,
    FaFileExcel,
    FaFileImage,
    FaFilePdf,
    FaFileWord,
    FaFolder,
    FaFolderOpen,
    FaFolderPlus,
    FaHome,
    FaTrashAlt,
    FaUpload,
} from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { arquivosAdminApi } from '../../api/resources';
import {
    Button,
    ConfirmDialog,
    Dialog,
    EmptyState,
    ErrorBlock,
    FilterInput,
    Input,
    LoadingBlock,
    Page,
    PageHeader,
    Reveal,
    tokens,
} from '../../ui';

const { colors } = tokens;

// ── apresentação ─────────────────────────────────────────────────────────────

function formatarTamanho(bytes) {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const unidades = ['KB', 'MB', 'GB', 'TB'];
    let valor = bytes / 1024;
    let i = 0;
    while (valor >= 1024 && i < unidades.length - 1) {
        valor /= 1024;
        i += 1;
    }
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: valor < 10 ? 1 : 0 })} ${unidades[i]}`;
}

const formatarData = (iso) =>
    iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function iconeDo(item) {
    if (item.pasta) return { Icone: FaFolder, cor: '#f59e0b' };
    const nome = item.nome.toLowerCase();
    if (/\.pdf$/.test(nome)) return { Icone: FaFilePdf, cor: '#dc2626' };
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(nome)) return { Icone: FaFileImage, cor: '#7c3aed' };
    if (/\.(zip|rar|7z|tar|gz|tgz|bz2)$/.test(nome)) return { Icone: FaFileArchive, cor: '#b45309' };
    if (/\.(xlsx?|csv|ods)$/.test(nome)) return { Icone: FaFileExcel, cor: '#16a34a' };
    if (/\.(docx?|odt|rtf)$/.test(nome)) return { Icone: FaFileWord, cor: '#2563eb' };
    if (/\.(sql|dump|bak|db|sqlite)$/.test(nome)) return { Icone: FaDatabase, cor: '#0891b2' };
    if (/\.(txt|log|md|json|xml)$/.test(nome)) return { Icone: FaFileAlt, cor: '#64748b' };
    return { Icone: FaFile, cor: '#64748b' };
}

// ── estilos ──────────────────────────────────────────────────────────────────

const Caminho = styled.nav`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-bottom: 14px;
    font-size: 0.92rem;

    button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: ${colors.muted};
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;

        &:hover:not(:disabled) {
            background: ${colors.neutralBg};
            color: ${colors.text};
        }

        &:disabled {
            color: ${colors.text};
            font-weight: 700;
            cursor: default;
        }
    }

    svg.sep {
        color: ${colors.muted};
        font-size: 10px;
    }
`;

const Uso = styled.div`
    margin-bottom: 14px;
    padding: 12px 16px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;

    .linha {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 0.86rem;
        color: ${colors.muted};

        strong {
            color: ${colors.text};
        }
    }

    .trilho {
        height: 8px;
        margin-top: 8px;
        border-radius: 99px;
        background: ${colors.neutralBg};
        overflow: hidden;
    }

    .barra {
        height: 100%;
        border-radius: 99px;
        background: ${({ $cor }) => $cor};
        transition: width 0.4s;
    }
`;

const Barra = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 14px;

    .busca {
        flex: 1 1 260px;
        min-width: 0;
    }

    .resumo {
        color: ${colors.muted};
        font-size: 0.85rem;
        padding-bottom: 12px;
    }
`;

const Area = styled.div`
    position: relative;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};
    overflow: hidden;
    outline: ${({ $arrastando }) => ($arrastando ? `3px dashed ${colors.primary}` : 'none')};
    outline-offset: -3px;
`;

const Solta = styled.div`
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--c-surface) 88%, transparent);
    color: ${colors.primary};
    font-weight: 700;
    font-size: 1.1rem;
    pointer-events: none;

    svg {
        display: block;
        margin: 0 auto 8px;
        font-size: 38px;
    }
`;

const Cabecalho = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px 160px 128px;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid ${colors.border};
    background: ${colors.surfaceAlt};
    color: ${colors.muted};
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    @media (max-width: 760px) {
        grid-template-columns: minmax(0, 1fr) 88px;
        .data,
        .acoes {
            display: none;
        }
    }
`;

const Linha = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px 160px 128px;
    gap: 12px;
    align-items: center;
    padding: 9px 16px;
    border-bottom: 1px solid ${colors.border};
    cursor: ${({ $pasta }) => ($pasta ? 'pointer' : 'default')};
    transition: background 0.12s;

    &:last-child {
        border-bottom: 0;
    }

    &:hover {
        background: ${colors.rowHover};
    }

    .nome {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        font-weight: ${({ $pasta }) => ($pasta ? 700 : 500)};
        color: ${colors.text};

        svg {
            flex: none;
            font-size: 20px;
        }

        span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .tamanho,
    .data {
        color: ${colors.muted};
        font-size: 0.86rem;
    }

    .acoes {
        display: flex;
        justify-content: flex-end;
        gap: 2px;
    }

    @media (max-width: 760px) {
        grid-template-columns: minmax(0, 1fr) 88px;
        .data {
            display: none;
        }
        .acoes {
            grid-column: 1 / -1;
            justify-content: flex-start;
            padding-left: 32px;
        }
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
    color: ${colors.muted};
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: ${({ $perigo }) => ($perigo ? colors.dangerBg : colors.neutralBg)};
        color: ${({ $perigo }) => ($perigo ? colors.danger : colors.text)};
    }

    &:disabled {
        opacity: 0.5;
        cursor: wait;
    }
`;

const PainelEnvios = styled.aside`
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 9000;
    width: min(380px, calc(100vw - 24px));
    max-height: 50vh;
    overflow: auto;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        border-bottom: 1px solid ${colors.border};
        font-weight: 700;
    }

    header button {
        border: 0;
        background: transparent;
        color: ${colors.muted};
        font: inherit;
        font-size: 0.82rem;
        cursor: pointer;
    }
`;

const Envio = styled.div`
    padding: 10px 14px;
    border-bottom: 1px solid ${colors.border};

    &:last-child {
        border-bottom: 0;
    }

    .topo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        font-weight: 600;

        span.nome {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .info {
        margin-top: 4px;
        color: ${({ $erro }) => ($erro ? colors.danger : colors.muted)};
        font-size: 0.78rem;
    }

    .trilho {
        height: 6px;
        margin-top: 6px;
        border-radius: 99px;
        background: ${colors.neutralBg};
        overflow: hidden;
    }

    .barra {
        height: 100%;
        background: ${({ $erro }) => ($erro ? colors.danger : colors.primary)};
        transition: width 0.2s;
    }
`;

// ── página ───────────────────────────────────────────────────────────────────

export default function Arquivos() {
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();
    const pasta = params.get('pasta') || '';
    const [busca, setBusca] = useState('');
    const [arrastando, setArrastando] = useState(false);
    const [envios, setEnvios] = useState([]);
    const [baixando, setBaixando] = useState(null);
    const [dialogo, setDialogo] = useState(null); // { tipo: 'pasta' | 'renomear' | 'excluir', item? }
    const [nome, setNome] = useState('');
    const seletor = useRef(null);
    const contador = useRef(0);

    const consulta = useQuery({
        queryKey: ['admin-arquivos', pasta],
        queryFn: () => arquivosAdminApi.listar(pasta),
        placeholderData: (previous) => previous,
    });
    const listagem = consulta.data;

    // Somar a pasta pode demorar na primeira vez; a tela não espera por isso.
    const usoConsulta = useQuery({ queryKey: ['admin-arquivos', 'uso'], queryFn: arquivosAdminApi.uso, staleTime: 5 * 60 * 1000, retry: false });
    const uso = usoConsulta.data;
    const fracao = uso ? Math.min(1, uso.usado / uso.limite) : 0;
    const corDoUso = fracao >= 0.9 ? 'var(--c-danger)' : fracao >= 0.75 ? 'var(--c-warning)' : 'var(--c-primary)';
    // Destino de envios e de novas pastas: a pasta da URL (vazia = raiz), nunca a da listagem anterior.
    const pastaAtual = pasta;

    const irPara = useCallback(
        (id) => {
            setBusca('');
            setParams(id && id !== listagem?.caminho?.[0]?.id ? { pasta: id } : {}, { replace: false });
        },
        [listagem, setParams],
    );

    const atualizar = () => queryClient.invalidateQueries({ queryKey: ['admin-arquivos'] });

    const itens = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const todos = listagem?.itens ?? [];
        return termo ? todos.filter((i) => i.nome.toLowerCase().includes(termo)) : todos;
    }, [listagem, busca]);

    // ── envio ────────────────────────────────────────────────────────────────

    const enviar = useCallback(
        async (arquivos) => {
            const destino = pastaAtual;
            const fila = Array.from(arquivos).map((arquivo) => ({ id: (contador.current += 1), arquivo, nome: arquivo.name, tamanho: arquivo.size, progresso: 0, estado: 'aguardando' }));
            if (fila.length === 0) return;
            setEnvios((atual) => [...atual, ...fila]);

            const mudar = (id, mudancas) => setEnvios((atual) => atual.map((e) => (e.id === id ? { ...e, ...mudancas } : e)));

            for (const envio of fila) {
                mudar(envio.id, { estado: 'enviando' });
                try {
                    await arquivosAdminApi.enviar(destino, envio.arquivo, (evento) => {
                        if (evento.total) mudar(envio.id, { progresso: Math.min(100, Math.round((evento.loaded / evento.total) * 100)) });
                    });
                    mudar(envio.id, { estado: 'ok', progresso: 100 });
                } catch (erro) {
                    mudar(envio.id, { estado: 'erro', erro: errorMessage(erro, 'Não foi possível enviar.') });
                }
            }
            atualizar();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [pastaAtual],
    );

    const aoSoltar = (evento) => {
        evento.preventDefault();
        setArrastando(false);
        if (evento.dataTransfer?.files?.length) enviar(evento.dataTransfer.files);
    };

    // ── ações ────────────────────────────────────────────────────────────────

    const baixar = async (item) => {
        setBaixando(item.id);
        try {
            const { caminho } = await arquivosAdminApi.link(item.id);
            const ancora = document.createElement('a');
            ancora.href = arquivosAdminApi.enderecoDoLink(caminho);
            ancora.rel = 'noopener';
            document.body.appendChild(ancora);
            ancora.click();
            ancora.remove();
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível baixar.'));
        } finally {
            setBaixando(null);
        }
    };

    const fechar = () => setDialogo(null);

    const criar = useMutation({
        mutationFn: () => arquivosAdminApi.criarPasta(pastaAtual, nome),
        onSuccess: () => {
            toast.success('Pasta criada.');
            fechar();
            atualizar();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const renomear = useMutation({
        mutationFn: () => arquivosAdminApi.renomear(dialogo.item.id, nome),
        onSuccess: () => {
            toast.success('Nome alterado.');
            fechar();
            atualizar();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const excluir = useMutation({
        mutationFn: () => arquivosAdminApi.excluir(dialogo.item.id),
        onSuccess: () => {
            toast.success('Enviado para a lixeira do Drive.');
            fechar();
            atualizar();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const abrirDialogo = (tipo, item) => {
        setNome(tipo === 'renomear' ? item.nome : '');
        setDialogo({ tipo, item });
    };

    const confirmarNome = (evento) => {
        evento.preventDefault();
        if (!nome.trim()) return;
        (dialogo.tipo === 'pasta' ? criar : renomear).mutate();
    };

    const emEnvio = envios.some((e) => e.estado === 'aguardando' || e.estado === 'enviando');
    const caminho = listagem?.caminho ?? [];
    const noDrive = listagem?.origem !== 'local';

    return (
        <Page>
            <PageHeader
                icon={FaFolderOpen}
                tone="orange"
                title="Arquivos"
                subtitle={noDrive ? 'O Drive da JPL dentro do sistema: guarde backups e documentos, crie pastas e baixe o que precisar.' : 'Arquivos do servidor (o Google Drive não está configurado neste ambiente).'}
                actions={
                    <>
                        <Button variant="secondary" icon={<FaFolderPlus />} onClick={() => abrirDialogo('pasta')}>
                            Nova pasta
                        </Button>
                        <Button icon={<FaUpload />} onClick={() => seletor.current?.click()}>
                            Enviar arquivos
                        </Button>
                    </>
                }
            />

            <input
                ref={seletor}
                type="file"
                multiple
                hidden
                onChange={(evento) => {
                    enviar(evento.target.files);
                    evento.target.value = '';
                }}
            />

            {uso && (
                <Uso $cor={corDoUso}>
                    <div className="linha">
                        <span>
                            Espaço usado: <strong>{formatarTamanho(uso.usado)}</strong> de {formatarTamanho(uso.limite)}
                        </span>
                        <span>{(fracao * 100).toLocaleString('pt-BR', { maximumFractionDigits: fracao < 0.01 ? 2 : 1 })}%</span>
                    </div>
                    <div className="trilho" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fracao * 100)}>
                        <div className="barra" style={{ width: `${Math.max(fracao * 100, uso.usado > 0 ? 0.6 : 0)}%` }} />
                    </div>
                </Uso>
            )}

            <Reveal>
                <Caminho aria-label="Caminho da pasta">
                    {caminho.map((parte, i) => {
                        const ultimo = i === caminho.length - 1;
                        return (
                            <span key={parte.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {i > 0 && <FaChevronRight className="sep" />}
                                <button type="button" disabled={ultimo} onClick={() => irPara(i === 0 ? '' : parte.id)}>
                                    {i === 0 && <FaHome />}
                                    {parte.nome}
                                </button>
                            </span>
                        );
                    })}
                </Caminho>

                <Barra>
                    <div className="busca">
                        <FilterInput label="Buscar nesta pasta" placeholder="Digite parte do nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    </div>
                    <span className="resumo">
                        {listagem ? `${listagem.itens.filter((i) => i.pasta).length} pasta(s), ${listagem.itens.filter((i) => !i.pasta).length} arquivo(s)` : ''}
                    </span>
                </Barra>

                {consulta.isLoading ? (
                    <LoadingBlock label="Abrindo a pasta..." />
                ) : consulta.isError ? (
                    <ErrorBlock message={errorMessage(consulta.error, 'Não foi possível abrir a pasta.')} onRetry={() => consulta.refetch()} />
                ) : (
                    <Area
                        $arrastando={arrastando}
                        onDragOver={(e) => {
                            if (e.dataTransfer?.types?.includes('Files')) {
                                e.preventDefault();
                                setArrastando(true);
                            }
                        }}
                        onDragLeave={(e) => e.currentTarget.contains(e.relatedTarget) || setArrastando(false)}
                        onDrop={aoSoltar}
                    >
                        {arrastando && (
                            <Solta>
                                <div>
                                    <FaCloudUploadAlt />
                                    Solte para enviar para “{listagem?.pasta?.nome}”
                                </div>
                            </Solta>
                        )}

                        {itens.length === 0 ? (
                            <EmptyState
                                icon={FaFolderOpen}
                                title={busca ? 'Nada encontrado' : 'Esta pasta está vazia'}
                                description={busca ? 'Nenhum item tem esse nome nesta pasta.' : 'Arraste arquivos para cá ou use “Enviar arquivos”.'}
                            />
                        ) : (
                            <>
                                <Cabecalho>
                                    <span>Nome</span>
                                    <span>Tamanho</span>
                                    <span className="data">Modificado</span>
                                    <span className="acoes" />
                                </Cabecalho>
                                {itens.map((item) => {
                                    const { Icone, cor } = iconeDo(item);
                                    return (
                                        <Linha key={item.id} $pasta={item.pasta} onClick={() => item.pasta && irPara(item.id)} onDoubleClick={() => !item.pasta && baixar(item)}>
                                            <div className="nome">
                                                <Icone style={{ color: cor }} />
                                                <span title={item.nome}>{item.nome}</span>
                                            </div>
                                            <span className="tamanho">{formatarTamanho(item.tamanho)}</span>
                                            <span className="data">{formatarData(item.modificadoEm)}</span>
                                            <div className="acoes" onClick={(e) => e.stopPropagation()}>
                                                {!item.pasta && (
                                                    <Acao type="button" title="Baixar" aria-label={`Baixar ${item.nome}`} disabled={baixando === item.id} onClick={() => baixar(item)}>
                                                        <FaDownload />
                                                    </Acao>
                                                )}
                                                <Acao type="button" title="Renomear" aria-label={`Renomear ${item.nome}`} onClick={() => abrirDialogo('renomear', item)}>
                                                    <FaEdit />
                                                </Acao>
                                                <Acao type="button" $perigo title="Excluir" aria-label={`Excluir ${item.nome}`} onClick={() => abrirDialogo('excluir', item)}>
                                                    <FaTrashAlt />
                                                </Acao>
                                            </div>
                                        </Linha>
                                    );
                                })}
                            </>
                        )}
                    </Area>
                )}
            </Reveal>

            <Dialog
                open={dialogo?.tipo === 'pasta' || dialogo?.tipo === 'renomear'}
                title={dialogo?.tipo === 'pasta' ? 'Nova pasta' : 'Renomear'}
                subtitle={dialogo?.tipo === 'pasta' ? `Será criada dentro de “${listagem?.pasta?.nome ?? ''}”.` : undefined}
                onClose={fechar}
                width={440}
                footer={
                    <>
                        <Button variant="secondary" onClick={fechar}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmarNome} loading={criar.isPending || renomear.isPending} disabled={!nome.trim()}>
                            {dialogo?.tipo === 'pasta' ? 'Criar pasta' : 'Salvar'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={confirmarNome}>
                    <Input autoFocus value={nome} maxLength={150} placeholder={dialogo?.tipo === 'pasta' ? 'Ex.: Backups 2026' : 'Novo nome'} onChange={(e) => setNome(e.target.value)} />
                </form>
            </Dialog>

            <ConfirmDialog
                open={dialogo?.tipo === 'excluir'}
                danger
                title={dialogo?.item?.pasta ? 'Excluir pasta?' : 'Excluir arquivo?'}
                message={
                    dialogo?.item
                        ? `“${dialogo.item.nome}”${dialogo.item.pasta ? ' e tudo que está dentro dela' : ''} irá para a lixeira do Drive, de onde pode ser recuperado por 30 dias. Atenção: boletos, contratos e fotos de serviços do sistema também ficam aqui, e excluí-los pode impedir a abertura deles.`
                        : ''
                }
                confirmLabel="Enviar para a lixeira"
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate()}
                onClose={fechar}
            />

            {envios.length > 0 && (
                <PainelEnvios aria-live="polite">
                    <header>
                        <span>{emEnvio ? 'Enviando arquivos...' : 'Envios concluídos'}</span>
                        {!emEnvio && (
                            <button type="button" onClick={() => setEnvios([])}>
                                Limpar
                            </button>
                        )}
                    </header>
                    {envios.map((envio) => (
                        <Envio key={envio.id} $erro={envio.estado === 'erro'}>
                            <div className="topo">
                                {envio.estado === 'ok' && <FaCheckCircle color="var(--c-success)" />}
                                {envio.estado === 'erro' && <FaExclamationCircle color="var(--c-danger)" />}
                                <span className="nome" title={envio.nome}>
                                    {envio.nome}
                                </span>
                                <span style={{ color: 'var(--c-muted)', fontSize: '0.78rem' }}>{formatarTamanho(envio.tamanho)}</span>
                            </div>
                            {envio.estado !== 'ok' && (
                                <>
                                    <div className="trilho">
                                        <div className="barra" style={{ width: `${envio.estado === 'erro' ? 100 : envio.progresso}%` }} />
                                    </div>
                                    <div className="info">
                                        {envio.estado === 'aguardando' && 'Na fila'}
                                        {envio.estado === 'enviando' && (envio.progresso >= 100 ? 'Guardando no Drive...' : `Enviando ${envio.progresso}%`)}
                                        {envio.estado === 'erro' && envio.erro}
                                    </div>
                                </>
                            )}
                        </Envio>
                    ))}
                </PainelEnvios>
            )}
        </Page>
    );
}
