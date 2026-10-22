import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBan, FaCalendarAlt, FaCheckCircle, FaClipboardCheck, FaEdit, FaFilePdf, FaHardHat, FaPlus, FaUndo } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { equipesApi, servicosApi } from '../../api/resources';
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DetalheHero,
    Dialog,
    ErrorBlock,
    Field,
    Input,
    LoadingBlock,
    Muted,
    Page,
    PageHeader,
    Row,
    Select,
    Textarea,
} from '../../ui';
import { formatDate } from '../../utils/masks';
import PreencherEtapaDialog from './PreencherEtapaDialog';
import { paraInputDataHora, rotuloTipoEtapa, STATUS_ETAPA, STATUS_SERVICO, TIPOS_ETAPA } from './formato';

const urlArquivo = (anexo) => `${process.env.REACT_APP_BASE_URL}${anexo.url}`;
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null);

function EtapaDialog({ etapa, equipes, pessoas, onClose, onSalvar, carregando }) {
    const [responsavelId, setResponsavelId] = useState(etapa.responsavel?.id ?? '');
    const [equipeId, setEquipeId] = useState(etapa.equipe?.id ?? '');
    const [agendada, setAgendada] = useState(paraInputDataHora(etapa.agendadaPara));
    const [prazo, setPrazo] = useState(etapa.prazo ? String(etapa.prazo).slice(0, 10) : '');
    const [observacoes, setObservacoes] = useState(etapa.observacoes ?? '');

    return (
        <Dialog
            open
            width={560}
            title={etapa.nome}
            subtitle="Atribuição, agendamento e prazo da tarefa."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button
                        loading={carregando}
                        onClick={() =>
                            onSalvar({
                                responsavelId: responsavelId || null,
                                equipeId: equipeId || null,
                                agendadaPara: agendada ? new Date(agendada).toISOString() : null,
                                prazo: prazo ? new Date(`${prazo}T12:00:00`).toISOString() : null,
                                observacoes: observacoes || null,
                            })
                        }
                    >
                        Salvar
                    </Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <Field label="Responsável">
                        <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                            <option value="">Quem for da equipe</option>
                            {pessoas.map((p) => <option key={p.id} value={p.id}>{p.name ?? p.login}{p.equipe ? ` · ${p.equipe.nome}` : ''}</option>)}
                        </Select>
                    </Field>
                    <Field label="Equipe">
                        <Select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
                            <option value="">Sem equipe</option>
                            {equipes.filter((e) => e.ativa).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </Select>
                    </Field>
                    <Field label="Agendada para">
                        <Input type="datetime-local" value={agendada} onChange={(e) => setAgendada(e.target.value)} />
                    </Field>
                    <Field label="Prazo">
                        <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                    </Field>
                </div>
                <Field label="Observações">
                    <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                </Field>
            </div>
        </Dialog>
    );
}

function NovaEtapaDialog({ equipes, pessoas, onClose, onSalvar, carregando }) {
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('OUTRO');
    const [agendada, setAgendada] = useState('');
    const [responsavelId, setResponsavelId] = useState('');

    return (
        <Dialog
            open
            width={520}
            title="Nova tarefa"
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button
                        loading={carregando}
                        disabled={nome.trim().length < 2}
                        onClick={() => onSalvar({ nome: nome.trim(), tipo, agendadaPara: agendada ? new Date(agendada).toISOString() : undefined, responsavelId: responsavelId || undefined })}
                    >
                        Adicionar
                    </Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <Field label="Nome da tarefa" required>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Retorno para ajuste" />
                </Field>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <Field label="Tipo">
                        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            {TIPOS_ETAPA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                    </Field>
                    <Field label="Agendada para">
                        <Input type="datetime-local" value={agendada} onChange={(e) => setAgendada(e.target.value)} />
                    </Field>
                    <Field label="Responsável">
                        <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                            <option value="">Definir depois</option>
                            {pessoas.map((p) => <option key={p.id} value={p.id}>{p.name ?? p.login}</option>)}
                        </Select>
                    </Field>
                </div>
                {equipes.length === 0 && <Muted>Nenhuma equipe cadastrada.</Muted>}
            </div>
        </Dialog>
    );
}

function Etapa({ etapa, onEditar, onAcao, onPreencher }) {
    const [verFotos, setVerFotos] = useState(false);
    const fotos = etapa.anexos.filter((a) => a.mimeType.startsWith('image/'));
    const arquivos = etapa.anexos.filter((a) => !a.mimeType.startsWith('image/'));
    const encerrada = ['CONCLUIDA', 'CANCELADA'].includes(etapa.status);
    const feitos = etapa.itens.filter((i) => i.completo).length;

    return (
        <Card>
            <Row $justify="space-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <strong style={{ fontSize: '1.05rem' }}>{etapa.ordem}. {etapa.nome}</strong>{' '}
                    <Badge $tone={STATUS_ETAPA[etapa.status]?.tom}>{STATUS_ETAPA[etapa.status]?.rotulo}</Badge>{' '}
                    <Badge $tone="neutral">{rotuloTipoEtapa(etapa.tipo)}</Badge>
                    {etapa.descricao && <div><Muted>{etapa.descricao}</Muted></div>}
                </div>
                <Row>
                    {!encerrada && <Button size="sm" icon={<FaClipboardCheck />} onClick={() => onPreencher(etapa)}>Preencher</Button>}
                    {!encerrada && <Button size="sm" variant="secondary" icon={<FaEdit />} onClick={() => onEditar(etapa)}>Atribuir / agendar</Button>}
                    {!encerrada && <Button size="sm" variant="ghost" icon={<FaBan />} onClick={() => onAcao(etapa, 'CANCELAR')}>Cancelar</Button>}
                    {encerrada && <Button size="sm" variant="secondary" icon={<FaUndo />} onClick={() => onAcao(etapa, 'REABRIR')}>Reabrir</Button>}
                </Row>
            </Row>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '10px 0' }}>
                <Muted>Responsável: <strong>{etapa.responsavel?.name ?? etapa.equipe?.nome ?? 'não definido'}</strong></Muted>
                {etapa.agendadaPara && <Muted><FaCalendarAlt style={{ verticalAlign: '-2px' }} /> {dataHora(etapa.agendadaPara)}</Muted>}
                {etapa.prazo && <Muted>Prazo: {formatDate(etapa.prazo)}</Muted>}
                {etapa.concluidaEm && <Muted><FaCheckCircle style={{ verticalAlign: '-2px' }} /> Concluída em {dataHora(etapa.concluidaEm)}</Muted>}
            </div>

            {etapa.itens.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                    {etapa.itens.map((i) => (
                        <li key={i.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span style={{ color: i.completo ? 'var(--c-success)' : 'var(--c-muted)' }}>{i.completo ? '✔' : '○'}</span>
                            <span>{i.titulo}</span>
                            {!i.obrigatorio && <Muted>(opcional)</Muted>}
                            {i.tipo === 'FOTO' && <Muted>{i.anexos}/{i.minimoFotos} foto(s)</Muted>}
                            {i.tipo === 'TEXTO' && i.valorTexto && <Muted>— {i.valorTexto}</Muted>}
                            {i.tipo === 'NUMERO' && i.valorNumero !== null && <Muted>— {i.valorNumero.toLocaleString('pt-BR')}</Muted>}
                            {i.tipo === 'SIM_NAO' && i.valorBool !== null && <Muted>— {i.valorBool ? 'Sim' : 'Não'}</Muted>}
                        </li>
                    ))}
                </ul>
            )}

            {etapa.itens.length > 0 && <div style={{ marginTop: 8 }}><Muted>{feitos} de {etapa.itens.length} itens preenchidos</Muted></div>}

            {(fotos.length > 0 || arquivos.length > 0) && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(verFotos ? fotos : fotos.slice(0, 6)).map((f) => (
                            <a key={f.id} href={urlArquivo(f)} target="_blank" rel="noreferrer" title={f.nomeArquivo}>
                                <img
                                    src={urlArquivo(f)}
                                    alt={f.nomeArquivo}
                                    loading="lazy"
                                    style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--c-border)' }}
                                />
                            </a>
                        ))}
                        {fotos.length > 6 && !verFotos && <Button size="sm" variant="ghost" onClick={() => setVerFotos(true)}>+{fotos.length - 6} fotos</Button>}
                    </div>
                    {arquivos.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {arquivos.map((a) => (
                                <a key={a.id} href={urlArquivo(a)} target="_blank" rel="noreferrer">
                                    <FaFilePdf style={{ verticalAlign: '-2px' }} /> {a.nomeArquivo}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {etapa.observacoes && <p style={{ margin: '10px 0 0', whiteSpace: 'pre-line' }}><Muted>Observações:</Muted> {etapa.observacoes}</p>}
        </Card>
    );
}

/** Detalhe do serviço: tarefas (cards), checklist, fotos e atribuições. */
export default function ServicoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editando, setEditando] = useState(null);
    const [preenchendo, setPreenchendo] = useState(null);
    const [novaEtapa, setNovaEtapa] = useState(false);
    const [cancelar, setCancelar] = useState(false);

    const servico = useQuery({ queryKey: ['servicos', 'detalhe', id], queryFn: () => servicosApi.obter(id), refetchInterval: 30_000 });
    const equipes = useQuery({ queryKey: ['equipes'], queryFn: equipesApi.listar });
    const pessoas = useQuery({ queryKey: ['servicos', 'pessoas'], queryFn: servicosApi.pessoas });

    const atualizar = (dados) => {
        queryClient.setQueryData(['servicos', 'detalhe', id], dados);
        queryClient.invalidateQueries({ queryKey: ['servicos', 'lista'] });
    };

    const salvarEtapa = useMutation({
        mutationFn: ({ etapaId, payload }) => servicosApi.atualizarEtapa(etapaId, payload),
        onSuccess: (dados) => {
            atualizar(dados);
            setEditando(null);
            toast.success('Tarefa atualizada.');
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    const incluirEtapa = useMutation({
        mutationFn: (payload) => servicosApi.adicionarEtapa(id, payload),
        onSuccess: (dados) => {
            atualizar(dados);
            setNovaEtapa(false);
            toast.success('Tarefa adicionada.');
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    const cancelarServico = useMutation({
        mutationFn: () => servicosApi.cancelar(id),
        onSuccess: (dados) => {
            atualizar(dados);
            setCancelar(false);
            toast.success('Serviço cancelado.');
        },
        onError: (e) => {
            setCancelar(false);
            toast.error(errorMessage(e));
        },
    });

    if (servico.isLoading) return <Page><LoadingBlock /></Page>;
    if (servico.error) return <Page><ErrorBlock message={errorMessage(servico.error)} onRetry={servico.refetch} /></Page>;

    const s = servico.data;
    const encerrado = ['CANCELADO', 'CONCLUIDO'].includes(s.status);

    const acaoEtapa = (etapa, acao) => salvarEtapa.mutate({ etapaId: etapa.id, payload: { acao } });

    return (
        <Page>
            <PageHeader
                icon={FaHardHat}
                tone="orange"
                title={s.titulo}
                subtitle={s.origem === 'CONTRATO' ? 'Serviço de contrato' : 'Serviço avulso'}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => navigate('/servicos')}>Voltar</Button>
                        {!encerrado && <Button variant="secondary" icon={<FaPlus />} onClick={() => setNovaEtapa(true)}>Nova tarefa</Button>}
                        {s.status !== 'CANCELADO' && s.status !== 'CONCLUIDO' && <Button variant="danger" icon={<FaBan />} onClick={() => setCancelar(true)}>Cancelar serviço</Button>}
                    </>
                }
            />

            <DetalheHero
                nome={s.cliente?.nome ?? s.usina?.code ?? s.titulo}
                tom="orange"
                icon={FaHardHat}
                chips={
                    <>
                        <Badge $tone={STATUS_SERVICO[s.status]?.tom}>{STATUS_SERVICO[s.status]?.rotulo}</Badge>
                        {s.modelo && <Badge $tone="neutral">{s.modelo.nome}</Badge>}
                        {s.equipe && <Badge $tone="info">{s.equipe.nome}</Badge>}
                    </>
                }
                indicadores={[
                    { rotulo: 'Andamento', valor: `${s.progresso.percentual}%` },
                    { rotulo: 'Tarefas concluídas', valor: `${s.progresso.concluidas} de ${s.progresso.total}` },
                    { rotulo: 'Iniciado em', valor: s.iniciadoEm ? formatDate(s.iniciadoEm) : '—' },
                    { rotulo: 'Concluído em', valor: s.concluidoEm ? formatDate(s.concluidoEm) : '—' },
                ]}
            />

            {(s.contrato || s.usina) && (
                <Card>
                    <Row>
                        {s.contrato && <Link to={`/contratos/${s.contrato.id}`}>Ver contrato de {formatDate(s.contrato.dataContrato)}</Link>}
                        {s.usina && <Link to={`/usinas/${s.usina.id}`}>Usina {s.usina.code}</Link>}
                        {s.cliente && <Link to={`/clientes/${s.cliente.id}`}>Cliente {s.cliente.nome}</Link>}
                    </Row>
                </Card>
            )}

            {s.observacoes && <Card><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{s.observacoes}</p></Card>}

            {s.etapas.map((etapa) => (
                <Etapa key={etapa.id} etapa={etapa} onEditar={setEditando} onAcao={acaoEtapa} onPreencher={(e) => setPreenchendo(e.id)} />
            ))}

            {preenchendo && (
                <PreencherEtapaDialog
                    etapaId={preenchendo}
                    onClose={() => setPreenchendo(null)}
                    onAlterou={() => {
                        queryClient.invalidateQueries({ queryKey: ['servicos'] });
                    }}
                />
            )}

            {editando && (
                <EtapaDialog
                    etapa={editando}
                    equipes={equipes.data ?? []}
                    pessoas={pessoas.data ?? []}
                    carregando={salvarEtapa.isPending}
                    onClose={() => setEditando(null)}
                    onSalvar={(payload) => salvarEtapa.mutate({ etapaId: editando.id, payload })}
                />
            )}
            {novaEtapa && (
                <NovaEtapaDialog
                    equipes={equipes.data ?? []}
                    pessoas={pessoas.data ?? []}
                    carregando={incluirEtapa.isPending}
                    onClose={() => setNovaEtapa(false)}
                    onSalvar={(payload) => incluirEtapa.mutate(payload)}
                />
            )}

            <ConfirmDialog
                open={cancelar}
                title="Cancelar serviço"
                message="Cancelar o serviço e todas as tarefas em aberto? Fotos e relatórios já enviados continuam guardados."
                confirmLabel="Cancelar serviço"
                danger
                loading={cancelarServico.isPending}
                onConfirm={() => cancelarServico.mutate()}
                onClose={() => setCancelar(false)}
            />
        </Page>
    );
}
