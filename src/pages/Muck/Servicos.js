import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheck, FaFileInvoiceDollar, FaFilePdf, FaPen, FaPlus, FaTimes, FaTruckMoving } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { muckApi, openFileInTab } from '../../api/resources';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Badge, Button, ConfirmDialog, DataTable, ErrorBlock, FilterInput, FilterSelect, Muted, Page, PageHeader, PaginationBar, StatCard, StatGrid, tokens } from '../../ui';
import { fimDoMes, hojeIso, inicioDoMes } from '../../utils/datas';
import { formatDate } from '../../utils/masks';
import BaixaDialog from '../Financial/BaixaDialog';
import SeletorPeriodo from '../Financial/SeletorPeriodo';
import NotasDialog from './NotasDialog';
import ServicoDialog from './ServicoDialog';
import { brl, COBRANCA, horasTexto, notaInfo, NOTAS_FILTRO, podeEmitirNota, SITUACOES_FILTRO } from './format';

const { colors } = tokens;

export default function Servicos() {
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();

    const hoje = hojeIso();
    const [periodo, setPeriodo] = useState({ de: params.get('de') ?? inicioDoMes(hoje), ate: params.get('ate') ?? fimDoMes(hoje) });
    const [filtros, setFiltros] = useState({
        veiculoId: '',
        busca: '',
        situacao: params.get('situacao') ?? '',
        nota: params.get('nota') ?? '',
        clienteId: params.get('clienteId') ?? '',
    });
    const [page, setPage] = useState(1);
    const buscaAtraso = useDebouncedValue(filtros.busca, 350);

    const [editando, setEditando] = useState(null);
    const [novo, setNovo] = useState(false);
    const [baixando, setBaixando] = useState(null);
    const [cancelando, setCancelando] = useState(null);
    const [selecao, setSelecao] = useState([]);
    const [revisando, setRevisando] = useState(false);

    const mudar = (campo) => (evento) => {
        setFiltros((f) => ({ ...f, [campo]: evento.target.value }));
        setPage(1);
    };

    const veiculos = useQuery({ queryKey: ['muck', 'veiculos'], queryFn: muckApi.veiculos });
    const consulta = { ...periodo, ...filtros, busca: buscaAtraso, page, pageSize: 30 };
    const lista = useQuery({ queryKey: ['muck', 'operacoes', consulta], queryFn: () => muckApi.operacoes(consulta), placeholderData: (anterior) => anterior });

    const cancelar = useMutation({
        mutationFn: (id) => muckApi.cancelarOperacao(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Serviço cancelado e conta a receber cancelada.');
            setCancelando(null);
        },
        onError: (erro) => {
            toast.error(errorMessage(erro));
            setCancelando(null);
        },
    });

    const linhas = useMemo(() => lista.data?.data ?? [], [lista.data]);
    const totais = lista.data?.totais;
    const emissiveis = useMemo(() => linhas.filter(podeEmitirNota), [linhas]);
    const todosMarcados = emissiveis.length > 0 && emissiveis.every((s) => selecao.includes(s.id));

    const alternar = (id) => setSelecao((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    const alternarTodos = () => setSelecao(todosMarcados ? selecao.filter((id) => !emissiveis.some((s) => s.id === id)) : [...new Set([...selecao, ...emissiveis.map((s) => s.id)])]);
    const selecionadosEmissiveis = selecao.slice(0, 20);

    const limparCliente = () => {
        setFiltros((f) => ({ ...f, clienteId: '' }));
        setParams({});
    };

    const colunas = [
        {
            key: 'sel',
            header: <input type="checkbox" aria-label="Selecionar todos que podem receber nota" checked={todosMarcados} onChange={alternarTodos} disabled={emissiveis.length === 0} />,
            width: 40,
            render: (s) => (podeEmitirNota(s) ? <input type="checkbox" aria-label="Selecionar para emitir nota" checked={selecao.includes(s.id)} onChange={() => alternar(s.id)} onClick={(e) => e.stopPropagation()} /> : null),
        },
        { key: 'data', header: 'Data', nowrap: true, render: (s) => formatDate(s.data) },
        {
            key: 'cliente',
            header: 'Cliente / serviço',
            minWidth: 240,
            render: (s) => (
                <div>
                    <strong>{s.cliente.nome}</strong>
                    <div><Muted>{s.destino}</Muted></div>
                    <div><Muted style={{ fontSize: '0.82rem' }}>{s.descricao.length > 90 ? `${s.descricao.slice(0, 90)}…` : s.descricao}</Muted></div>
                </div>
            ),
        },
        { key: 'motorista', header: 'Motorista', render: (s) => s.motorista?.nome ?? '—' },
        { key: 'horas', header: 'Horas', nowrap: true, render: (s) => horasTexto(s.horas) },
        {
            key: 'valor',
            header: 'Valor',
            nowrap: true,
            render: (s) => (
                <div>
                    <strong>{brl(s.valorTotal)}</strong>
                    {s.pago > 0 && s.saldo > 0 && <div><Muted style={{ fontSize: '0.82rem' }}>falta {brl(s.saldo)}</Muted></div>}
                </div>
            ),
        },
        {
            key: 'cobranca',
            header: 'Pagamento',
            nowrap: true,
            render: (s) => {
                const info = COBRANCA[s.situacao] ?? COBRANCA.ABERTO;
                return (
                    <div>
                        <Badge $tone={info.tone}>{info.label}</Badge>
                        <div><Muted style={{ fontSize: '0.82rem' }}>{s.situacao === 'PAGO' && s.pagoEm ? `em ${formatDate(s.pagoEm)}` : `vence ${formatDate(s.dataVencimento)}`}</Muted></div>
                    </div>
                );
            },
        },
        {
            key: 'nota',
            header: 'Nota fiscal',
            nowrap: true,
            render: (s) => {
                const info = notaInfo(s);
                return <Badge $tone={info.tone}>{info.label}{info.numero ? ` nº ${info.numero}` : ''}</Badge>;
            },
        },
        {
            key: 'acoes',
            header: '',
            nowrap: true,
            render: (s) =>
                s.status === 'CANCELADA' ? null : (
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        {s.saldo > 0 && (
                            <Button size="sm" variant="ghost" title="Registrar pagamento" aria-label="Registrar pagamento" onClick={() => setBaixando(s)}><FaCheck /></Button>
                        )}
                        {s.emiteNota && (
                            <Button
                                size="sm"
                                variant="ghost"
                                title="Ver espelho da nota"
                                aria-label="Ver espelho da nota"
                                onClick={() => openFileInTab(() => muckApi.espelho(s.id), 'espelho.pdf', 'Gerando espelho…').catch((erro) => toast.error(errorMessage(erro)))}
                            >
                                <FaFilePdf />
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Editar" aria-label="Editar" onClick={() => setEditando(s)}><FaPen /></Button>
                        <Button size="sm" variant="ghost" title="Cancelar serviço" aria-label="Cancelar serviço" onClick={() => setCancelando(s)}><FaTimes /></Button>
                    </div>
                ),
        },
    ];

    return (
        <Page>
            <PageHeader
                title="Serviços do munck"
                subtitle="Cada serviço registrado já entra em contas a receber."
                icon={FaTruckMoving}
                actions={
                    <>
                        {selecionadosEmissiveis.length > 0 && (
                            <Button variant="secondary" icon={<FaFileInvoiceDollar />} onClick={() => setRevisando(true)}>
                                Revisar e emitir notas ({selecionadosEmissiveis.length})
                            </Button>
                        )}
                        <Button icon={<FaPlus />} onClick={() => setNovo(true)}>Novo serviço</Button>
                    </>
                }
            />

            <SeletorPeriodo
                de={periodo.de}
                ate={periodo.ate}
                onChange={(p) => {
                    setPeriodo(p);
                    setPage(1);
                }}
            />

            <StatGrid style={{ margin: '16px 0' }}>
                <StatCard rotulo="Horas trabalhadas" valor={horasTexto(totais?.horas)} tom="blue" />
                <StatCard rotulo="Faturado" valor={brl(totais?.valor)} tom="blue" />
                <StatCard rotulo="Recebido" valor={brl(totais?.pago)} tom="green" />
                <StatCard rotulo="A receber" valor={brl(totais?.emAberto)} tom={totais?.emAberto > 0 ? 'orange' : 'green'} />
            </StatGrid>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 12 }}>
                <FilterInput label="Buscar" placeholder="Cliente, destino ou descrição" value={filtros.busca} onChange={mudar('busca')} />
                <FilterSelect label="Veículo" value={filtros.veiculoId} onChange={mudar('veiculoId')} options={(veiculos.data ?? []).map((v) => ({ value: v.id, label: v.nome }))} />
                <FilterSelect label="Pagamento" value={filtros.situacao} onChange={mudar('situacao')} options={SITUACOES_FILTRO} />
                <FilterSelect label="Nota fiscal" value={filtros.nota} onChange={mudar('nota')} options={NOTAS_FILTRO} />
            </div>

            {filtros.clienteId && (
                <div style={{ marginBottom: 12 }}>
                    <Badge $tone="info">Filtrando por um cliente</Badge>{' '}
                    <Button size="sm" variant="ghost" onClick={limparCliente}>Ver todos</Button>
                </div>
            )}

            {lista.isError ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : (
                <>
                    <DataTable
                        columns={colunas}
                        rows={linhas}
                        loading={lista.isLoading}
                        emptyTitle="Nenhum serviço neste período"
                        emptyDescription="Registre o primeiro serviço do munck em “Novo serviço”."
                        onRowClick={(s) => s.status !== 'CANCELADA' && setEditando(s)}
                    />
                    {lista.data?.meta && <PaginationBar meta={lista.data.meta} onPageChange={setPage} label="serviços" />}
                </>
            )}
            {selecao.length > 20 && <Muted style={{ color: colors.warning }}>As notas são emitidas em lotes de até 20 por vez.</Muted>}

            <ServicoDialog open={novo || Boolean(editando)} servico={editando} onClose={() => { setNovo(false); setEditando(null); }} />

            <BaixaDialog
                open={Boolean(baixando)}
                lancamento={baixando ? { id: baixando.lancamentoId, tipo: 'RECEBER', valorRestante: baixando.saldo, conta: null } : null}
                onClose={() => setBaixando(null)}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ['muck'] })}
            />

            <ConfirmDialog
                open={Boolean(cancelando)}
                title="Cancelar este serviço?"
                message={cancelando ? `O serviço de ${cancelando.cliente.nome} (${brl(cancelando.valorTotal)}) e a conta a receber dele serão cancelados.` : ''}
                confirmLabel="Cancelar serviço"
                danger
                loading={cancelar.isPending}
                onConfirm={() => cancelar.mutate(cancelando.id)}
                onClose={() => setCancelando(null)}
            />

            <NotasDialog
                open={revisando}
                ids={selecionadosEmissiveis}
                onClose={() => setRevisando(false)}
                onDone={() => setSelecao([])}
            />
        </Page>
    );
}
