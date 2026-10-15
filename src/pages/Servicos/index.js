import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaClipboardList, FaHardHat, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { clientesApi, equipesApi, modelosServicoApi, servicosApi } from '../../api/resources';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
    Badge,
    Button,
    Card,
    Combobox,
    DataTable,
    Dialog,
    ErrorBlock,
    Field,
    FilterInput,
    FilterSelect,
    Grid,
    Input,
    Muted,
    Page,
    PageHeader,
    PaginationBar,
    Select,
    Tabs,
    Textarea,
} from '../../ui';
import { formatDocumento } from '../../utils/masks';
import { rotuloTipoEtapa, STATUS_ETAPA, STATUS_SERVICO } from './formato';

const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const soData = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

function Barra({ percentual }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--c-neutral-bg)', overflow: 'hidden' }}>
                <div style={{ width: `${percentual}%`, height: '100%', background: 'var(--c-success)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', width: 34, textAlign: 'right' }}>{percentual}%</span>
        </div>
    );
}

/** Serviço fora de contrato: limpeza, visita técnica, manutenção — com data e responsável. */
function ServicoAvulsoDialog({ onClose }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const modelos = useQuery({ queryKey: ['modelos-servico', 'ativos'], queryFn: () => modelosServicoApi.listar(true) });
    const equipes = useQuery({ queryKey: ['equipes'], queryFn: equipesApi.listar });
    const pessoas = useQuery({ queryKey: ['servicos', 'pessoas'], queryFn: servicosApi.pessoas });

    const [modeloId, setModeloId] = useState('');
    const [cliente, setCliente] = useState(null);
    const [quando, setQuando] = useState('');
    const [equipeId, setEquipeId] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const lista = (modelos.data ?? []).filter((m) => !m.tipoContrato || true);
    const escolhido = modeloId || lista.find((m) => m.nome.toLowerCase().includes('limpeza'))?.id || lista[0]?.id || '';

    const buscarClientes = async (termo) =>
        (await clientesApi.options(termo)).map((c) => ({ value: c.id, label: c.nome, hint: c.documento ? formatDocumento(c.documento) : undefined }));

    const criar = useMutation({
        mutationFn: () =>
            servicosApi.criarAvulso({
                modeloId: escolhido,
                clienteId: cliente?.value,
                agendadaPara: quando ? new Date(quando).toISOString() : undefined,
                equipeId: equipeId || undefined,
                responsavelId: responsavelId || undefined,
                observacoes: observacoes || undefined,
            }),
        onSuccess: async (servico) => {
            await queryClient.invalidateQueries({ queryKey: ['servicos'] });
            toast.success('Serviço agendado.');
            onClose();
            navigate(`/servicos/${servico.id}`);
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    return (
        <Dialog
            open
            width={620}
            title="Novo serviço avulso"
            subtitle="Limpeza, visita técnica ou manutenção, sem contrato novo."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button loading={criar.isPending} disabled={!escolhido || !cliente} onClick={() => criar.mutate()}>Agendar</Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <Field label="Tipo de serviço" required>
                    <Select value={escolhido} onChange={(e) => setModeloId(e.target.value)}>
                        {lista.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </Select>
                </Field>
                <Combobox
                    label="Cliente"
                    required
                    placeholder="Digite o nome ou o CPF/CNPJ do cliente"
                    queryKey="clientes-servico"
                    fetcher={buscarClientes}
                    selected={cliente}
                    onChange={(id, opcao) => setCliente(id ? { value: id, label: opcao?.label ?? '' } : null)}
                />
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <Field label="Data e hora">
                        <Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />
                    </Field>
                    <Field label="Equipe">
                        <Select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
                            <option value="">Definir depois</option>
                            {(equipes.data ?? []).filter((e) => e.ativa).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </Select>
                    </Field>
                    <Field label="Responsável">
                        <Select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                            <option value="">Definir depois</option>
                            {(pessoas.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name ?? p.login}</option>)}
                        </Select>
                    </Field>
                </div>
                <Field label="Observações">
                    <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                </Field>
            </div>
        </Dialog>
    );
}

function Agenda() {
    const navigate = useNavigate();
    const [dias, setDias] = useState(30);
    const params = useMemo(() => {
        const de = new Date();
        de.setHours(0, 0, 0, 0);
        const ate = new Date(de.getTime() + dias * 86_400_000);
        return { de: de.toISOString(), ate: ate.toISOString() };
    }, [dias]);

    const agenda = useQuery({ queryKey: ['servicos', 'agenda', params], queryFn: () => servicosApi.agenda(params) });

    const porDia = useMemo(() => {
        const mapa = new Map();
        for (const item of agenda.data ?? []) {
            const chave = soData(item.agendadaPara);
            if (!mapa.has(chave)) mapa.set(chave, []);
            mapa.get(chave).push(item);
        }
        return [...mapa.entries()];
    }, [agenda.data]);

    return (
        <>
            <Card>
                <Grid $cols={3}>
                    <FilterSelect
                        label="Período"
                        placeholder={null}
                        value={String(dias)}
                        onChange={(e) => setDias(Number(e.target.value))}
                        options={[{ value: '7', label: 'Próximos 7 dias' }, { value: '30', label: 'Próximos 30 dias' }, { value: '90', label: 'Próximos 90 dias' }]}
                    />
                </Grid>
            </Card>

            {agenda.error ? (
                <ErrorBlock message={errorMessage(agenda.error)} onRetry={agenda.refetch} />
            ) : porDia.length === 0 ? (
                <Card><Muted>Nada agendado neste período.</Muted></Card>
            ) : (
                porDia.map(([dia, itens]) => (
                    <Card key={dia}>
                        <strong>{dia}</strong>
                        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            {itens.map((i) => (
                                <button
                                    key={i.id}
                                    type="button"
                                    onClick={() => navigate(`/servicos/${i.servico.id}`)}
                                    style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 10, background: 'transparent', color: 'inherit', cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap' }}
                                >
                                    <span style={{ width: 54 }}>{new Date(i.agendadaPara).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <strong style={{ flex: 1, minWidth: 180 }}>{i.nome}</strong>
                                    <Muted>{i.servico.cliente?.nome ?? i.servico.usina?.code ?? i.servico.titulo}</Muted>
                                    <Muted>{rotuloTipoEtapa(i.tipo)}</Muted>
                                    <Muted>{i.responsavel?.name ?? i.equipe?.nome ?? 'Sem responsável'}</Muted>
                                    <Badge $tone={STATUS_ETAPA[i.status]?.tom}>{STATUS_ETAPA[i.status]?.rotulo}</Badge>
                                </button>
                            ))}
                        </div>
                    </Card>
                ))
            )}
        </>
    );
}

/** Serviços em campo: lista, andamento e agenda. */
export default function Servicos() {
    const navigate = useNavigate();
    const [aba, setAba] = useState('lista');
    const [busca, setBusca] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [novo, setNovo] = useState(false);
    const termo = useDebouncedValue(busca, 300);

    const lista = useQuery({
        queryKey: ['servicos', 'lista', termo, status, page],
        queryFn: () => servicosApi.listar({ search: termo, status, page, pageSize: 20 }),
        placeholderData: (anterior) => anterior,
        enabled: aba === 'lista',
    });

    const colunas = [
        {
            key: 'titulo',
            header: 'Serviço',
            render: (s) => (
                <div>
                    <strong>{s.titulo}</strong>
                    <div><Muted>{s.origem === 'CONTRATO' ? 'Contrato' : 'Avulso'}{s.usina ? ` · ${s.usina.code}` : ''}</Muted></div>
                </div>
            ),
        },
        { key: 'cliente', header: 'Cliente', render: (s) => s.cliente?.nome ?? '—' },
        { key: 'progresso', header: 'Andamento', render: (s) => <Barra percentual={s.progresso.percentual} /> },
        {
            key: 'proxima',
            header: 'Próxima tarefa',
            render: (s) => (s.proximaEtapa ? <span>{s.proximaEtapa.nome}{s.proximaEtapa.agendadaPara ? <Muted> · {dataHora(s.proximaEtapa.agendadaPara)}</Muted> : null}</span> : '—'),
        },
        { key: 'resp', header: 'Responsável', render: (s) => s.responsavel?.name ?? s.equipe?.nome ?? '—' },
        { key: 'status', header: 'Situação', render: (s) => <Badge $tone={STATUS_SERVICO[s.status]?.tom}>{STATUS_SERVICO[s.status]?.rotulo}</Badge> },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaHardHat}
                tone="orange"
                title="Serviços"
                subtitle="Execução em campo: tarefas, equipes, agenda e fotos."
                actions={
                    <>
                        <Button variant="secondary" icon={<FaClipboardList />} onClick={() => navigate('/servicos/modelos')}>Modelos</Button>
                        <Button icon={<FaPlus />} onClick={() => setNovo(true)}>Novo serviço avulso</Button>
                    </>
                }
            />

            <Tabs
                tabs={[
                    { id: 'lista', label: 'Serviços', icon: <FaHardHat /> },
                    { id: 'agenda', label: 'Agenda', icon: <FaCalendarAlt /> },
                ]}
                value={aba}
                onChange={setAba}
            />

            {aba === 'lista' && (
                <>
                    <Card>
                        <Grid $cols={3}>
                            <FilterInput label="Buscar" placeholder="Cliente, usina ou título" value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1); }} />
                            <FilterSelect
                                label="Situação"
                                placeholder="Todas"
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                options={Object.entries(STATUS_SERVICO).map(([value, v]) => ({ value, label: v.rotulo }))}
                            />
                        </Grid>
                    </Card>
                    {lista.error ? (
                        <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
                    ) : (
                        <Card>
                            <DataTable
                                loading={lista.isLoading}
                                rows={lista.data?.data}
                                columns={colunas}
                                onRowClick={(s) => navigate(`/servicos/${s.id}`)}
                                emptyTitle="Nenhum serviço"
                                emptyDescription="Abra um contrato e use “Iniciar serviço”, ou crie um serviço avulso."
                            />
                            {lista.data && <PaginationBar meta={lista.data.meta} onPageChange={setPage} label="serviços" />}
                        </Card>
                    )}
                </>
            )}

            {aba === 'agenda' && <Agenda />}

            {novo && <ServicoAvulsoDialog onClose={() => setNovo(false)} />}
        </Page>
    );
}
