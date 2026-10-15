import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowDown, FaArrowUp, FaClipboardList, FaPlus, FaStar, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { modelosServicoApi } from '../../api/resources';
import { Badge, Button, Card, ConfirmDialog, Dialog, ErrorBlock, Field, Input, LoadingBlock, Muted, Page, PageHeader, Row, Select, Textarea } from '../../ui';
import { rotuloTipoEtapa, TIPOS_ETAPA, TIPOS_ITEM } from './formato';

const itemVazio = () => ({ titulo: '', tipo: 'FOTO', obrigatorio: true, minimoFotos: 1, instrucao: '' });
const etapaVazia = () => ({ nome: '', tipo: 'OUTRO', diasPrazo: '', descricao: '', itens: [itemVazio()] });

const moverNaLista = (lista, indice, delta) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= lista.length) return lista;
    const copia = [...lista];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    return copia;
};

function ModeloEditor({ modelo, onClose }) {
    const queryClient = useQueryClient();
    const [estado, setEstado] = useState(() => ({
        nome: modelo?.nome ?? '',
        descricao: modelo?.descricao ?? '',
        tipoContrato: modelo?.tipoContrato ?? '',
        padrao: modelo?.padrao ?? false,
        ativo: modelo?.ativo ?? true,
        etapas: modelo
            ? modelo.etapas.map((e) => ({
                nome: e.nome,
                tipo: e.tipo,
                diasPrazo: e.diasPrazo ?? '',
                descricao: e.descricao ?? '',
                itens: e.itens.map((i) => ({ titulo: i.titulo, tipo: i.tipo, obrigatorio: i.obrigatorio, minimoFotos: i.minimoFotos, instrucao: i.instrucao ?? '' })),
            }))
            : [etapaVazia()],
    }));
    const [erro, setErro] = useState('');

    const salvar = useMutation({
        mutationFn: (payload) => (modelo ? modelosServicoApi.atualizar(modelo.id, payload) : modelosServicoApi.criar(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['modelos-servico'] });
            toast.success('Modelo salvo.');
            onClose();
        },
        onError: (e) => setErro(errorMessage(e)),
    });

    const alterar = (campo, valor) => setEstado((s) => ({ ...s, [campo]: valor }));
    const alterarEtapa = (i, campo, valor) => setEstado((s) => ({ ...s, etapas: s.etapas.map((e, j) => (j === i ? { ...e, [campo]: valor } : e)) }));
    const alterarItem = (i, k, campo, valor) =>
        setEstado((s) => ({
            ...s,
            etapas: s.etapas.map((e, j) => (j === i ? { ...e, itens: e.itens.map((it, l) => (l === k ? { ...it, [campo]: valor } : it)) } : e)),
        }));

    const enviar = () => {
        setErro('');
        if (estado.nome.trim().length < 2) return setErro('Informe o nome do modelo.');
        if (estado.etapas.length === 0) return setErro('Inclua ao menos uma etapa.');
        for (const e of estado.etapas) {
            if (e.nome.trim().length < 2) return setErro('Toda etapa precisa de um nome.');
            if (e.itens.some((i) => i.titulo.trim().length < 2)) return setErro(`Há item sem título na etapa "${e.nome}".`);
        }

        return salvar.mutate({
            nome: estado.nome.trim(),
            descricao: estado.descricao.trim() || undefined,
            tipoContrato: estado.tipoContrato || null,
            padrao: estado.padrao,
            ativo: estado.ativo,
            etapas: estado.etapas.map((e) => ({
                nome: e.nome.trim(),
                tipo: e.tipo,
                diasPrazo: e.diasPrazo === '' ? null : Number(e.diasPrazo),
                descricao: e.descricao.trim() || undefined,
                itens: e.itens.map((i) => ({
                    titulo: i.titulo.trim(),
                    tipo: i.tipo,
                    obrigatorio: i.obrigatorio,
                    minimoFotos: Number(i.minimoFotos) || 1,
                    instrucao: i.instrucao.trim() || undefined,
                })),
            })),
        });
    };

    return (
        <Dialog
            open
            width={900}
            title={modelo ? 'Editar modelo de serviço' : 'Novo modelo de serviço'}
            subtitle="As etapas viram os cards de tarefa; os itens são o que o instalador precisa anexar ou preencher."
            onClose={onClose}
            footer={
                <>
                    {erro && <span style={{ marginRight: 'auto', color: 'var(--c-danger)' }}>{erro}</span>}
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button loading={salvar.isPending} onClick={enviar}>Salvar modelo</Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <Field label="Nome do modelo" required>
                        <Input value={estado.nome} onChange={(e) => alterar('nome', e.target.value)} />
                    </Field>
                    <Field label="Aplicar ao contrato do tipo">
                        <Select value={estado.tipoContrato} onChange={(e) => alterar('tipoContrato', e.target.value)}>
                            <option value="">Qualquer</option>
                            <option value="COMPRA_VENDA">Compra e venda</option>
                            <option value="PRESTACAO_SERVICOS">Prestação de serviços (instalação)</option>
                            <option value="SERVICO_GERAL">Serviço geral</option>
                        </Select>
                    </Field>
                    <Field label="Modelo padrão">
                        <Select value={String(estado.padrao)} onChange={(e) => alterar('padrao', e.target.value === 'true')}>
                            <option value="false">Não</option>
                            <option value="true">Sim</option>
                        </Select>
                    </Field>
                    <Field label="Ativo">
                        <Select value={String(estado.ativo)} onChange={(e) => alterar('ativo', e.target.value === 'true')}>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                        </Select>
                    </Field>
                </div>
                <Field label="Descrição">
                    <Textarea rows={2} value={estado.descricao} onChange={(e) => alterar('descricao', e.target.value)} />
                </Field>

                {estado.etapas.map((etapa, i) => (
                    <Card key={i} style={{ margin: 0 }}>
                        <Row $justify="space-between">
                            <strong>Etapa {i + 1}</strong>
                            <Row>
                                <Button size="sm" variant="ghost" icon={<FaArrowUp />} disabled={i === 0} onClick={() => alterar('etapas', moverNaLista(estado.etapas, i, -1))} aria-label="Subir" />
                                <Button size="sm" variant="ghost" icon={<FaArrowDown />} disabled={i === estado.etapas.length - 1} onClick={() => alterar('etapas', moverNaLista(estado.etapas, i, 1))} aria-label="Descer" />
                                <Button size="sm" variant="ghost" icon={<FaTrash />} onClick={() => alterar('etapas', estado.etapas.filter((_, j) => j !== i))} aria-label="Remover etapa" />
                            </Row>
                        </Row>
                        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 8 }}>
                            <Field label="Nome da etapa" required>
                                <Input value={etapa.nome} onChange={(e) => alterarEtapa(i, 'nome', e.target.value)} placeholder="Ex.: Visita técnica" />
                            </Field>
                            <Field label="Tipo">
                                <Select value={etapa.tipo} onChange={(e) => alterarEtapa(i, 'tipo', e.target.value)}>
                                    {TIPOS_ETAPA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </Select>
                            </Field>
                            <Field label="Prazo (dias após iniciar)">
                                <Input type="number" min="0" value={etapa.diasPrazo} onChange={(e) => alterarEtapa(i, 'diasPrazo', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Orientação para o instalador">
                            <Input value={etapa.descricao} onChange={(e) => alterarEtapa(i, 'descricao', e.target.value)} />
                        </Field>

                        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                            <Muted>Itens do checklist (o que precisa ser anexado ou preenchido)</Muted>
                            {etapa.itens.map((item, k) => (
                                <div key={k} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(180px, 2fr) minmax(130px, 1fr) 80px auto auto', alignItems: 'end' }}>
                                    <Field label={k === 0 ? 'Título' : undefined}>
                                        <Input value={item.titulo} onChange={(e) => alterarItem(i, k, 'titulo', e.target.value)} placeholder="Ex.: Foto do padrão elétrico" />
                                    </Field>
                                    <Field label={k === 0 ? 'Tipo' : undefined}>
                                        <Select value={item.tipo} onChange={(e) => alterarItem(i, k, 'tipo', e.target.value)}>
                                            {TIPOS_ITEM.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </Select>
                                    </Field>
                                    <Field label={k === 0 ? 'Mín. fotos' : undefined}>
                                        <Input type="number" min="1" max="20" disabled={item.tipo !== 'FOTO'} value={item.minimoFotos} onChange={(e) => alterarItem(i, k, 'minimoFotos', e.target.value)} />
                                    </Field>
                                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 10 }}>
                                        <input type="checkbox" checked={item.obrigatorio} onChange={(e) => alterarItem(i, k, 'obrigatorio', e.target.checked)} /> Obrigatório
                                    </label>
                                    <Button size="sm" variant="ghost" icon={<FaTrash />} aria-label="Remover item" onClick={() => alterarEtapa(i, 'itens', etapa.itens.filter((_, l) => l !== k))} />
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Input
                                            value={item.instrucao}
                                            onChange={(e) => alterarItem(i, k, 'instrucao', e.target.value)}
                                            placeholder="Instrução para o instalador (opcional)"
                                        />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <Button size="sm" variant="secondary" icon={<FaPlus />} onClick={() => alterarEtapa(i, 'itens', [...etapa.itens, itemVazio()])}>Adicionar item</Button>
                            </div>
                        </div>
                    </Card>
                ))}

                <div>
                    <Button variant="secondary" icon={<FaPlus />} onClick={() => alterar('etapas', [...estado.etapas, etapaVazia()])}>Adicionar etapa</Button>
                </div>
            </div>
        </Dialog>
    );
}

/** Modelos de serviço: etapas e checklists que o aplicativo cobra do instalador. */
export default function Modelos() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editando, setEditando] = useState(null); // objeto | 'novo'
    const [excluir, setExcluir] = useState(null);

    const modelos = useQuery({ queryKey: ['modelos-servico'], queryFn: () => modelosServicoApi.listar() });

    const remover = useMutation({
        mutationFn: (id) => modelosServicoApi.remover(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['modelos-servico'] });
            toast.success('Modelo excluído.');
            setExcluir(null);
        },
        onError: (e) => {
            setExcluir(null);
            toast.error(errorMessage(e));
        },
    });

    return (
        <Page>
            <PageHeader
                icon={FaClipboardList}
                tone="purple"
                title="Modelos de serviço"
                subtitle="Etapas e checklists usados ao iniciar um serviço."
                actions={
                    <>
                        <Button variant="secondary" onClick={() => navigate('/servicos')}>Voltar aos serviços</Button>
                        <Button icon={<FaPlus />} onClick={() => setEditando('novo')}>Novo modelo</Button>
                    </>
                }
            />

            {modelos.error ? (
                <ErrorBlock message={errorMessage(modelos.error)} onRetry={modelos.refetch} />
            ) : modelos.isLoading ? (
                <LoadingBlock />
            ) : (
                (modelos.data ?? []).map((m) => (
                    <Card key={m.id}>
                        <Row $justify="space-between">
                            <div>
                                <strong>{m.nome}</strong>{' '}
                                {m.padrao && <Badge $tone="success"><FaStar style={{ verticalAlign: '-1px' }} /> Padrão</Badge>}{' '}
                                {!m.ativo && <Badge $tone="neutral">Inativo</Badge>}
                                {m.descricao && <div><Muted>{m.descricao}</Muted></div>}
                            </div>
                            <Row>
                                <Button size="sm" variant="secondary" onClick={() => setEditando(m)}>Editar</Button>
                                <Button size="sm" variant="ghost" icon={<FaTrash />} aria-label="Excluir" onClick={() => setExcluir(m)} />
                            </Row>
                        </Row>
                        <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'grid', gap: 4 }}>
                            {m.etapas.map((e) => (
                                <li key={e.id}>
                                    <strong>{e.nome}</strong> <Muted>· {rotuloTipoEtapa(e.tipo)}{e.diasPrazo ? ` · prazo ${e.diasPrazo} dia(s)` : ''} · {e.itens.length} item(ns)</Muted>
                                </li>
                            ))}
                        </ol>
                    </Card>
                ))
            )}

            {editando && <ModeloEditor modelo={editando === 'novo' ? null : editando} onClose={() => setEditando(null)} />}

            <ConfirmDialog
                open={Boolean(excluir)}
                title="Excluir modelo"
                message="Excluir este modelo? Os serviços já iniciados com ele continuam como estão."
                confirmLabel="Excluir"
                danger
                loading={remover.isPending}
                onConfirm={() => remover.mutate(excluir.id)}
                onClose={() => setExcluir(null)}
            />
        </Page>
    );
}
