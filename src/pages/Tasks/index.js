import { DndContext, DragOverlay, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaCheckCircle, FaClipboardList, FaExclamationCircle, FaPlus, FaRegCircle, FaRegClock, FaTrash, FaUndo } from 'react-icons/fa';
import styled, { css } from 'styled-components';
import * as Yup from 'yup';
import { errorMessage } from '../../api/client';
import { tarefasApi } from '../../api/resources';
import { hojeIso } from '../../utils/datas';
import {
    Badge,
    Button,
    ConfirmDialog,
    DateField,
    Dialog,
    EmptyState,
    ErrorBlock,
    LoadingBlock,
    Page,
    PageHeader,
    Reveal,
    Row,
    SelectField,
    StatCard,
    StatGrid,
    TextField,
    TextareaField,
    palette,
    tokens,
} from '../../ui';

const { colors } = tokens;

const TONS = ['blue', 'orange', 'purple', 'green', 'teal', 'red'];

const Quadro = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(280px, 1fr);
    gap: 16px;
    align-items: start;
    overflow-x: auto;
    padding-bottom: 12px;

    @media (max-width: 760px) {
        grid-auto-flow: row;
        grid-auto-columns: auto;
    }
`;

const ColunaBox = styled.section`
    background: ${colors.surfaceAlt};
    border: 1px solid ${({ $sobre, $cor }) => ($sobre ? $cor : colors.border)};
    border-top: 4px solid ${({ $cor }) => $cor};
    border-radius: 14px;
    padding: 12px;
    min-height: 140px;
    transition: border-color 0.15s, background 0.15s;
    ${({ $sobre }) => $sobre && css`background: ${colors.infoBg};`}
`;

const ColunaTopo = styled.header`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    h2 {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 0.98rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const BotaoIcone = styled.button`
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: ${colors.muted};
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: ${({ $perigo }) => ($perigo ? colors.dangerBg : colors.neutralBg)};
        color: ${({ $perigo }) => ($perigo ? colors.danger : colors.text)};
    }
`;

const Cartao = styled.article`
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 10px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.15s, transform 0.15s, opacity 0.15s;
    opacity: ${({ $arrastando, $concluida }) => ($arrastando ? 0.35 : $concluida ? 0.7 : 1)};

    &:hover {
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
    }

    .topo {
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }

    .titulo {
        flex: 1;
        font-weight: 700;
        line-height: 1.35;
        word-break: break-word;
        text-decoration: ${({ $concluida }) => ($concluida ? 'line-through' : 'none')};
        color: ${({ $concluida }) => ($concluida ? colors.muted : colors.text)};
    }

    .concluir {
        flex: none;
        margin-top: 1px;
        padding: 0;
        border: 0;
        background: transparent;
        color: ${({ $concluida }) => ($concluida ? colors.success : colors.muted)};
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        transition: color 0.15s, transform 0.1s;

        &:hover {
            color: ${colors.success};
            transform: scale(1.12);
        }
    }

    .descricao {
        margin-top: 4px;
        font-size: 0.86rem;
        color: ${colors.muted};
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .rodape {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
`;

const Adicionar = styled.button`
    width: 100%;
    padding: 10px;
    border: 2px dashed ${colors.border};
    border-radius: 12px;
    background: transparent;
    color: ${colors.muted};
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;

    &:hover {
        border-color: ${colors.primary};
        color: ${colors.primary};
        background: rgba(211, 47, 47, 0.04);
    }
`;

const NovaColuna = styled(Adicionar)`
    min-height: 120px;
    align-self: stretch;
`;

const umDia = 86400000;

/** Prazo: tom e texto conforme a proximidade (vencida, hoje, em breve, tranquila). */
function infoPrazo(dataFinal, concluidaEm) {
    // Tarefa concluída não está atrasada nem "em breve": mostra quando foi feita.
    if (concluidaEm) return { tom: 'success', texto: `Concluída ${new Date(concluidaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`, icone: <FaCheckCircle /> };
    if (!dataFinal) return null;

    const inicioHoje = Date.parse(`${hojeIso()}T00:00:00.000Z`);
    const alvo = new Date(dataFinal);
    const dias = Math.round((Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth(), alvo.getUTCDate()) - inicioHoje) / umDia);
    const data = alvo.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' });

    if (dias < 0) return { tom: 'danger', texto: `Atrasada ${-dias}d · ${data}`, icone: <FaExclamationCircle /> };
    if (dias === 0) return { tom: 'warning', texto: 'Hoje', icone: <FaRegClock /> };
    if (dias <= 3) return { tom: 'warning', texto: `Em ${dias}d · ${data}`, icone: <FaRegClock /> };
    return { tom: 'neutral', texto: data, icone: <FaCalendarAlt /> };
}

const schema = Yup.object({ name: Yup.string().trim().required('Dê um nome para a tarefa.') });

function CartaoDeTarefa({ tarefa, onAbrir, onConcluir, sobreposicao = false }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `t:${tarefa.id}`, disabled: sobreposicao });
    const { setNodeRef: setDropRef } = useDroppable({ id: `t:${tarefa.id}`, disabled: sobreposicao });
    const concluida = Boolean(tarefa.concluidaEm);
    const prazo = infoPrazo(tarefa.dataFinal, tarefa.concluidaEm);

    return (
        <Cartao
            $concluida={concluida}
            ref={(no) => {
                setNodeRef(no);
                setDropRef(no);
            }}
            $arrastando={isDragging && !sobreposicao}
            onClick={() => !isDragging && onAbrir?.(tarefa)}
            {...attributes}
            {...listeners}
        >
            <div className="topo">
                {onConcluir && (
                    <button
                        type="button"
                        className="concluir"
                        title={concluida ? 'Reabrir tarefa' : 'Marcar como concluída'}
                        aria-label={concluida ? `Reabrir ${tarefa.name}` : `Concluir ${tarefa.name}`}
                        // Não pode iniciar o arrastar nem abrir o cartão: é só o botão.
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onConcluir(tarefa);
                        }}
                    >
                        {concluida ? <FaCheckCircle /> : <FaRegCircle />}
                    </button>
                )}
                <div className="titulo">{tarefa.name}</div>
            </div>
            {tarefa.description && <div className="descricao">{tarefa.description}</div>}
            {prazo && (
                <div className="rodape">
                    <Badge $tone={prazo.tom}>{prazo.icone} {prazo.texto}</Badge>
                </div>
            )}
        </Cartao>
    );
}

function Coluna({ coluna, cor, onNovaTarefa, onAbrirTarefa, onExcluir, onConcluir, ocultarConcluidas }) {
    const visiveis = ocultarConcluidas ? coluna.tasks.filter((t) => !t.concluidaEm) : coluna.tasks;
    const abertas = coluna.tasks.filter((t) => !t.concluidaEm).length;
    const { setNodeRef, isOver } = useDroppable({ id: `c:${coluna.id}` });

    return (
        <ColunaBox ref={setNodeRef} $cor={cor} $sobre={isOver}>
            <ColunaTopo>
                <h2>{coluna.title}</h2>
                <Badge title={`${abertas} em aberto, ${coluna.tasks.length - abertas} concluída(s)`}>{abertas}</Badge>
                <BotaoIcone type="button" title="Excluir coluna" aria-label={`Excluir coluna ${coluna.title}`} $perigo onClick={() => onExcluir(coluna)}>
                    <FaTrash />
                </BotaoIcone>
            </ColunaTopo>

            {visiveis.map((tarefa) => (
                <CartaoDeTarefa key={tarefa.id} tarefa={tarefa} onAbrir={onAbrirTarefa} onConcluir={onConcluir} />
            ))}

            <Adicionar type="button" onClick={() => onNovaTarefa(coluna)}>
                <FaPlus /> Adicionar tarefa
            </Adicionar>
        </ColunaBox>
    );
}

/** Quadro de tarefas (kanban): arraste os cartões entre colunas; clique para editar. */
export default function Tasks() {
    const queryClient = useQueryClient();
    const [editando, setEditando] = useState(null); // { tarefa?, colunaId }
    const [novaColuna, setNovaColuna] = useState(false);
    const [excluirColuna, setExcluirColuna] = useState(null);
    const [excluirTarefa, setExcluirTarefa] = useState(null);
    const [arrastada, setArrastada] = useState(null);
    const [ocultarConcluidas, setOcultarConcluidas] = useState(false);

    // Só começa a arrastar depois de mover alguns pixels: assim o clique abre a tarefa.
    const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const { data: colunas = [], isLoading, error, refetch } = useQuery({
        queryKey: ['tarefas', 'colunas'],
        queryFn: tarefasApi.columns,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['tarefas'] });

    const salvarTarefa = useMutation({
        mutationFn: ({ id, payload }) => (id ? tarefasApi.updateTask(id, payload) : tarefasApi.createTask(payload)),
        onSuccess: async (_r, { id }) => {
            await refresh();
            toast.success(id ? 'Tarefa atualizada.' : 'Tarefa criada.');
            setEditando(null);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const criarColuna = useMutation({
        mutationFn: (title) => tarefasApi.createColumn(title),
        onSuccess: async () => { await refresh(); setNovaColuna(false); toast.success('Coluna criada.'); },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const removerColuna = useMutation({
        mutationFn: (id) => tarefasApi.removeColumn(id),
        onSuccess: async () => { await refresh(); setExcluirColuna(null); toast.success('Coluna removida.'); },
        onError: (erro) => { setExcluirColuna(null); toast.error(errorMessage(erro)); },
    });

    const removerTarefa = useMutation({
        mutationFn: (id) => tarefasApi.removeTask(id),
        onSuccess: async () => { await refresh(); setExcluirTarefa(null); setEditando(null); toast.success('Tarefa removida.'); },
        onError: (erro) => { setExcluirTarefa(null); toast.error(errorMessage(erro)); },
    });

    // Concluir ou reabrir direto no cartão: reflete na hora e confirma com o servidor.
    const concluir = useMutation({
        mutationFn: ({ id, concluida }) => tarefasApi.updateTask(id, { concluida }),
        onMutate: async ({ id, concluida }) => {
            await queryClient.cancelQueries({ queryKey: ['tarefas', 'colunas'] });
            const anterior = queryClient.getQueryData(['tarefas', 'colunas']);
            queryClient.setQueryData(['tarefas', 'colunas'], (atual = []) =>
                atual.map((c) => ({ ...c, tasks: c.tasks.map((t) => (t.id === id ? { ...t, concluidaEm: concluida ? new Date().toISOString() : null } : t)) })),
            );
            return { anterior };
        },
        onError: (erro, _v, contexto) => {
            if (contexto?.anterior) queryClient.setQueryData(['tarefas', 'colunas'], contexto.anterior);
            toast.error(errorMessage(erro));
        },
        onSuccess: (_r, { concluida }) => toast.success(concluida ? 'Tarefa concluída.' : 'Tarefa reaberta.'),
        onSettled: refresh,
    });
    const alternarConclusao = (tarefa) => concluir.mutate({ id: tarefa.id, concluida: !tarefa.concluidaEm });

    const mover = useMutation({
        mutationFn: ({ id, columnId, position }) => tarefasApi.updateTask(id, { columnId, position }),
        // Reflete o movimento na hora; se o servidor recusar, recarrega o estado real.
        onMutate: async ({ id, columnId, position }) => {
            await queryClient.cancelQueries({ queryKey: ['tarefas', 'colunas'] });
            const anterior = queryClient.getQueryData(['tarefas', 'colunas']);
            queryClient.setQueryData(['tarefas', 'colunas'], (atual = []) => {
                const copia = atual.map((c) => ({ ...c, tasks: [...c.tasks] }));
                let tarefa;
                for (const c of copia) {
                    const indice = c.tasks.findIndex((t) => t.id === id);
                    if (indice >= 0) [tarefa] = c.tasks.splice(indice, 1);
                }
                const destino = copia.find((c) => c.id === columnId);
                if (tarefa && destino) destino.tasks.splice(Math.min(position, destino.tasks.length), 0, { ...tarefa, columnId });
                return copia;
            });
            return { anterior };
        },
        onError: (erro, _v, contexto) => {
            if (contexto?.anterior) queryClient.setQueryData(['tarefas', 'colunas'], contexto.anterior);
            toast.error(errorMessage(erro));
        },
        onSettled: refresh,
    });

    const resumo = useMemo(() => {
        const todas = colunas.flatMap((c) => c.tasks);
        const abertas = todas.filter((t) => !t.concluidaEm);
        const dias = (t) => (t.dataFinal ? infoPrazo(t.dataFinal) : null);
        return {
            total: abertas.length,
            concluidas: todas.length - abertas.length,
            atrasadas: abertas.filter((t) => dias(t)?.tom === 'danger').length,
            proximas: abertas.filter((t) => dias(t)?.tom === 'warning').length,
        };
    }, [colunas]);

    const aoSoltar = ({ active, over }) => {
        setArrastada(null);
        if (!over) return;

        const tarefaId = String(active.id).replace('t:', '');
        const alvo = String(over.id);

        let colunaDestino;
        let posicao;
        let alvoId = null;

        if (alvo.startsWith('c:')) {
            colunaDestino = colunas.find((c) => c.id === alvo.slice(2));
            posicao = colunaDestino ? colunaDestino.tasks.filter((t) => t.id !== tarefaId).length : 0;
        } else {
            alvoId = alvo.replace('t:', '');
            colunaDestino = colunas.find((c) => c.tasks.some((t) => t.id === alvoId));
            const lista = colunaDestino ? colunaDestino.tasks.filter((t) => t.id !== tarefaId) : [];
            posicao = Math.max(0, lista.findIndex((t) => t.id === alvoId));
        }

        if (!colunaDestino || alvoId === tarefaId) return;
        mover.mutate({ id: tarefaId, columnId: colunaDestino.id, position: posicao });
    };

    if (isLoading) return <Page><LoadingBlock /></Page>;
    if (error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    const colunaOptions = colunas.map((c) => ({ value: c.id, label: c.title }));
    const tarefaEmEdicao = editando?.tarefa;

    return (
        <Page>
            <PageHeader
                icon={FaClipboardList}
                tone="teal"
                title="Tarefas"
                subtitle="Arraste os cartões entre as colunas."
                actions={
                    <>
                        <Button variant="secondary" icon={ocultarConcluidas ? <FaRegCircle /> : <FaCheckCircle />} onClick={() => setOcultarConcluidas((v) => !v)}>
                            {ocultarConcluidas ? 'Mostrar concluídas' : 'Ocultar concluídas'}
                        </Button>
                        <Button icon={<FaPlus />} onClick={() => setNovaColuna(true)}>Nova coluna</Button>
                    </>
                }
            />

            <StatGrid>
                <StatCard icon={FaClipboardList} tom="blue" rotulo="Em aberto" valor={resumo.total} detalhe={`em ${colunas.length} coluna(s)`} delay={0} />
                <StatCard icon={FaExclamationCircle} tom="red" rotulo="Atrasadas" valor={resumo.atrasadas} detalhe="passaram do prazo" delay={60} />
                <StatCard icon={FaRegClock} tom="orange" rotulo="Vencem em breve" valor={resumo.proximas} detalhe="hoje ou nos próximos 3 dias" delay={120} />
                <StatCard icon={FaCheckCircle} tom="green" rotulo="Concluídas" valor={resumo.concluidas} detalhe="marcadas como feitas" delay={180} />
            </StatGrid>

            {colunas.length === 0 ? (
                <EmptyState
                    icon={FaClipboardList}
                    title="Seu quadro está vazio"
                    description="Crie colunas como “A fazer”, “Em andamento” e “Concluído”."
                    action={<Button icon={<FaPlus />} onClick={() => setNovaColuna(true)}>Criar primeira coluna</Button>}
                />
            ) : (
                <DndContext
                    sensors={sensores}
                    collisionDetection={closestCorners}
                    onDragStart={({ active }) => setArrastada(String(active.id).replace('t:', ''))}
                    onDragCancel={() => setArrastada(null)}
                    onDragEnd={aoSoltar}
                >
                    <Quadro>
                        {colunas.map((coluna, indice) => (
                            <Reveal key={coluna.id} $delay={indice * 50}>
                                <Coluna
                                    coluna={coluna}
                                    cor={palette[TONS[indice % TONS.length]].fg}
                                    onNovaTarefa={(c) => setEditando({ colunaId: c.id })}
                                    onAbrirTarefa={(t) => setEditando({ tarefa: t, colunaId: t.columnId ?? coluna.id })}
                                    onExcluir={setExcluirColuna}
                                    onConcluir={alternarConclusao}
                                    ocultarConcluidas={ocultarConcluidas}
                                />
                            </Reveal>
                        ))}
                        <NovaColuna type="button" onClick={() => setNovaColuna(true)}><FaPlus /> Nova coluna</NovaColuna>
                    </Quadro>

                    <DragOverlay>
                        {arrastada && (() => {
                            const tarefa = colunas.flatMap((c) => c.tasks).find((t) => t.id === arrastada);
                            return tarefa ? <CartaoDeTarefa tarefa={tarefa} sobreposicao /> : null;
                        })()}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Criar / editar tarefa */}
            {editando && (
                <Formik
                    initialValues={{
                        name: tarefaEmEdicao?.name ?? '',
                        description: tarefaEmEdicao?.description ?? '',
                        dataFinal: tarefaEmEdicao?.dataFinal ? new Date(tarefaEmEdicao.dataFinal).toISOString().slice(0, 10) : '',
                        columnId: editando.colunaId,
                    }}
                    validationSchema={schema}
                    onSubmit={(values) => salvarTarefa.mutateAsync({
                        id: tarefaEmEdicao?.id,
                        payload: {
                            name: values.name.trim(),
                            description: values.description ?? '',
                            dataFinal: values.dataFinal || null,
                            columnId: values.columnId,
                        },
                    })}
                >
                    {({ isSubmitting }) => (
                        <Dialog
                            open
                            width={540}
                            onClose={() => setEditando(null)}
                            title={tarefaEmEdicao ? 'Editar tarefa' : 'Nova tarefa'}
                            footer={
                                <>
                                    {tarefaEmEdicao && (
                                        <Button variant="danger" icon={<FaTrash />} onClick={() => setExcluirTarefa(tarefaEmEdicao)} style={{ marginRight: 'auto' }}>
                                            Excluir
                                        </Button>
                                    )}
                                    <Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
                                    {tarefaEmEdicao && (
                                        <Button
                                            variant="secondary"
                                            icon={tarefaEmEdicao.concluidaEm ? <FaUndo /> : <FaCheckCircle />}
                                            loading={concluir.isPending}
                                            onClick={async () => {
                                                await concluir.mutateAsync({ id: tarefaEmEdicao.id, concluida: !tarefaEmEdicao.concluidaEm });
                                                setEditando(null);
                                            }}
                                        >
                                            {tarefaEmEdicao.concluidaEm ? 'Reabrir' : 'Concluir tarefa'}
                                        </Button>
                                    )}
                                    <Button type="submit" form="tarefa-form" loading={isSubmitting}>Salvar</Button>
                                </>
                            }
                        >
                            <Form noValidate id="tarefa-form">
                                <TextField name="name" label="Título" required autoFocus />
                                <TextareaField name="description" label="Descrição" rows={4} />
                                <Row $gap={12} $wrap={false} style={{ alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}><DateField name="dataFinal" label="Prazo" /></div>
                                    <div style={{ flex: 1 }}><SelectField name="columnId" label="Coluna" options={colunaOptions} placeholder="Selecione" /></div>
                                </Row>
                            </Form>
                        </Dialog>
                    )}
                </Formik>
            )}

            {/* Nova coluna */}
            {novaColuna && (
                <Formik
                    initialValues={{ title: '' }}
                    validationSchema={Yup.object({ title: Yup.string().trim().required('Informe o nome da coluna.') })}
                    onSubmit={(values) => criarColuna.mutateAsync(values.title.trim())}
                >
                    {({ isSubmitting }) => (
                        <Dialog
                            open
                            width={420}
                            onClose={() => setNovaColuna(false)}
                            title="Nova coluna"
                            footer={
                                <>
                                    <Button variant="secondary" onClick={() => setNovaColuna(false)}>Cancelar</Button>
                                    <Button type="submit" form="coluna-form" loading={isSubmitting}>Criar coluna</Button>
                                </>
                            }
                        >
                            <Form noValidate id="coluna-form">
                                <TextField name="title" label="Nome da coluna" placeholder="Ex.: Em andamento" required autoFocus />
                            </Form>
                        </Dialog>
                    )}
                </Formik>
            )}

            <ConfirmDialog
                open={Boolean(excluirColuna)}
                title="Excluir coluna"
                message={`Excluir a coluna "${excluirColuna?.title ?? ''}"${excluirColuna?.tasks?.length ? ` e suas ${excluirColuna.tasks.length} tarefa(s)` : ''}? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir coluna"
                danger
                loading={removerColuna.isPending}
                onConfirm={() => removerColuna.mutate(excluirColuna.id)}
                onClose={() => setExcluirColuna(null)}
            />
            <ConfirmDialog
                open={Boolean(excluirTarefa)}
                title="Excluir tarefa"
                message={`Excluir a tarefa "${excluirTarefa?.name ?? ''}"?`}
                confirmLabel="Excluir tarefa"
                danger
                loading={removerTarefa.isPending}
                onConfirm={() => removerTarefa.mutate(excluirTarefa.id)}
                onClose={() => setExcluirTarefa(null)}
            />
        </Page>
    );
}
