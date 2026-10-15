import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBarcode, FaCheckCircle, FaClock, FaExclamationTriangle, FaFilePdf, FaPrint, FaSearch, FaSyncAlt, FaTimesCircle } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi, imprimirBoletos, openFileInTab, sicrediApi } from '../../api/resources';
import {
    Badge,
    Button,
    Card,
    DataTable,
    ErrorBlock,
    FilterInput,
    FilterSelect,
    Grid,
    KeyValue,
    LoadingBlock,
    Muted,
    Page,
    PageHeader,
    PaginationBar,
    Row,
    SectionTitle,
    StatCard,
    StatGrid,
    Tabs,
    tokens,
} from '../../ui';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { dataBr, dataHoraBr, fimDoMes, hojeIso, inicioDoMes } from '../../utils/datas';
import { formatDate } from '../../utils/masks';
import BoletosDoBanco from './boleto/BoletosDoBanco';
import ConciliarDialog from './boleto/ConciliarDialog';
import GerenciarBoletoDialog from './boleto/GerenciarBoletoDialog';
import { brl } from './format';
import LancamentoDialog from './LancamentoDialog';
import SeletorPeriodo from './SeletorPeriodo';

const { colors } = tokens;

const PAGE_SIZE = 15;

const SITUACOES = [
    { value: 'EM_CARTEIRA', label: 'A vencer' },
    { value: 'VENCIDO', label: 'Vencidos' },
    { value: 'LIQUIDADO', label: 'Liquidados' },
    { value: 'BAIXADO', label: 'Baixados' },
    { value: 'PROTESTO', label: 'Em protesto' },
    { value: 'NEGATIVACAO', label: 'Negativados' },
    { value: 'REJEITADO', label: 'Rejeitados' },
];

const TOM = { EM_CARTEIRA: 'info', VENCIDO: 'danger', LIQUIDADO: 'success', BAIXADO: 'neutral', BAIXA_PENDENTE: 'warning', PROTESTO: 'warning', NEGATIVACAO: 'warning', REJEITADO: 'danger', DESCONHECIDA: 'neutral' };

const Marcar = styled.input`
    width: 17px;
    height: 17px;
    accent-color: ${colors.primary};
    cursor: pointer;
`;

const BarraSelecao = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 12px;
    border-radius: 12px;
    background: ${colors.infoBg};
    color: ${colors.info};
    font-weight: 600;
`;

const Filtros = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};

    > .busca {
        flex: 1 1 280px;
        min-width: 0;
    }

    > .situacao {
        width: 190px;
    }
`;

// ── Meus boletos ─────────────────────────────────────────────────────────────

function MeusBoletos() {
    const queryClient = useQueryClient();
    const [situacao, setSituacao] = useState('');
    const [busca, setBusca] = useState('');
    const [periodo, setPeriodo] = useState({ de: inicioDoMes(hojeIso()), ate: fimDoMes(hojeIso()) });
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'dataVencimento', direction: 'asc' });
    const [marcados, setMarcados] = useState([]);
    const [lancamentoAberto, setLancamentoAberto] = useState(null);
    const [gerenciando, setGerenciando] = useState(null);
    const [imprimindo, setImprimindo] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [porFolha, setPorFolha] = useState('3');

    const termo = useDebouncedValue(busca);
    // Ao pesquisar por número ou nome, o período não restringe (o boleto pode estar em qualquer mês).
    const usaPeriodo = !termo.trim();

    const params = {
        search: termo.trim() || undefined,
        situacao: situacao || undefined,
        vencimentoDe: usaPeriodo ? periodo.de || undefined : undefined,
        vencimentoAte: usaPeriodo ? periodo.ate || undefined : undefined,
        page,
        pageSize: PAGE_SIZE,
        sort: `${sort.field}:${sort.direction}`,
    };

    const resumo = useQuery({ queryKey: ['financeiro', 'boletos', 'resumo'], queryFn: financeiroApi.boletosResumo });
    const lista = useQuery({
        queryKey: ['financeiro', 'boletos', params],
        queryFn: () => financeiroApi.boletos(params),
        placeholderData: (anterior) => anterior,
    });

    const linhas = lista.data?.data ?? [];
    const todosMarcados = linhas.length > 0 && linhas.every((l) => marcados.includes(l.id));

    const alternar = (id) => setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    const alternarTodos = () => setMarcados((atual) => (todosMarcados ? atual.filter((id) => !linhas.some((l) => l.id === id)) : [...new Set([...atual, ...linhas.map((l) => l.id)])]));

    const imprimir = async (ids) => {
        setImprimindo(true);
        try {
            const falhas = await imprimirBoletos(ids, Number(porFolha));
            if (falhas.length > 0) {
                toast(`${falhas.length} boleto(s) ficaram de fora: ${falhas.slice(0, 3).map((f) => `${f.descricao || 'boleto'} (${f.motivo})`).join('; ')}`, { duration: 8000 });
            }
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível reunir os boletos.'));
        } finally {
            setImprimindo(false);
        }
    };

    const abrirPdf = async (id) => {
        try {
            await openFileInTab(() => financeiroApi.boletoPdf(id), 'boleto.pdf', 'Abrindo boleto…');
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível abrir o boleto.'));
        }
    };

    const atualizarSelecionados = async () => {
        setAtualizando(true);
        let baixados = 0;
        let falhas = 0;
        for (const id of marcados) {
            try {
                const r = await financeiroApi.atualizarBoleto(id);
                if (r.baixouAgora) baixados++;
            } catch {
                falhas++;
            }
        }
        await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
        setAtualizando(false);
        toast.success(`${marcados.length - falhas} consultado(s) no banco${baixados ? `, ${baixados} baixado(s)` : ''}${falhas ? `, ${falhas} com erro` : ''}.`);
    };

    const alternarOrdem = (campo) => {
        setPage(1);
        setSort((atual) => (atual.field === campo ? { field: campo, direction: atual.direction === 'asc' ? 'desc' : 'asc' } : { field: campo, direction: 'asc' }));
    };

    const colunas = [
        {
            key: 'marcar',
            header: <Marcar type="checkbox" aria-label="Marcar todos" checked={todosMarcados} onChange={alternarTodos} />,
            width: 40,
            render: (l) => <Marcar type="checkbox" aria-label="Marcar boleto" checked={marcados.includes(l.id)} onChange={() => alternar(l.id)} onClick={(e) => e.stopPropagation()} />,
        },
        {
            key: 'cliente',
            header: 'Cliente',
            sortKey: 'cliente',
            minWidth: 260,
            render: (l) => (
                <div>
                    <strong>{l.cliente?.nome ?? '—'}</strong>
                    <div><Muted>{l.descricao}{l.parcelaTotal ? ` · ${l.parcelaNumero}/${l.parcelaTotal}` : ''}</Muted></div>
                </div>
            ),
        },
        { key: 'nossoNumero', header: 'Nº do boleto', sortKey: 'nossoNumero', render: (l) => <code>{l.nossoNumero}</code> },
        { key: 'vencimento', header: 'Vencimento', sortKey: 'dataVencimento', render: (l) => formatDate(l.dataVencimento) },
        { key: 'emitidoEm', header: 'Emitido em', sortKey: 'emitidoEm', render: (l) => (l.emitidoEm ? formatDate(l.emitidoEm) : '—') },
        { key: 'pagoEm', header: 'Pago em', sortKey: 'dataPagamento', render: (l) => (l.pagoEm ? formatDate(l.pagoEm) : '—') },
        {
            key: 'valor',
            header: 'Valor',
            sortKey: 'valor',
            render: (l) => (
                <div>
                    <strong>{brl(l.valor)}</strong>
                    {l.valorLiquidado !== null && l.valorLiquidado !== undefined && Math.abs(l.valorLiquidado - l.valor) > 0.009 && (
                        <div><Muted style={{ fontSize: '0.78rem' }}>pago {brl(l.valorLiquidado)}</Muted></div>
                    )}
                </div>
            ),
        },
        {
            key: 'situacao',
            header: 'Situação',
            sortKey: 'situacao',
            render: (l) => (
                <div>
                    <Badge $tone={TOM[l.situacao.codigo] ?? 'neutral'}>{l.situacao.rotulo}</Badge>
                    {l.situacao.consultadoEm && <div><Muted style={{ fontSize: '0.75rem' }}>banco: {dataHoraBr(l.situacao.consultadoEm)}</Muted></div>}
                </div>
            ),
        },
        {
            key: 'acoes',
            header: '',
            width: 210,
            render: (l) => (
                <Row $justify="flex-end" $wrap={false}>
                    <Button size="sm" variant="ghost" title="PDF do boleto" aria-label="PDF do boleto" onClick={(e) => { e.stopPropagation(); abrirPdf(l.id); }}><FaFilePdf /></Button>
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setGerenciando(l); }}>Gerenciar</Button>
                </Row>
            ),
        },
    ];

    return (
        <>
            <StatGrid>
                <StatCard icon={FaClock} tom="blue" rotulo="A vencer" valor={resumo.data?.emCarteira.quantidade ?? 0} detalhe={brl(resumo.data?.emCarteira.valor ?? 0)} ativo={situacao === 'EM_CARTEIRA'} onClick={() => { setSituacao(situacao === 'EM_CARTEIRA' ? '' : 'EM_CARTEIRA'); setPage(1); }} />
                <StatCard icon={FaExclamationTriangle} tom="red" rotulo="Vencidos" valor={resumo.data?.vencidos.quantidade ?? 0} detalhe={brl(resumo.data?.vencidos.valor ?? 0)} ativo={situacao === 'VENCIDO'} onClick={() => { setSituacao(situacao === 'VENCIDO' ? '' : 'VENCIDO'); setPage(1); }} />
                <StatCard icon={FaCheckCircle} tom="green" rotulo="Liquidados" valor={resumo.data?.liquidados.quantidade ?? 0} detalhe={brl(resumo.data?.liquidados.valor ?? 0)} ativo={situacao === 'LIQUIDADO'} onClick={() => { setSituacao(situacao === 'LIQUIDADO' ? '' : 'LIQUIDADO'); setPage(1); }} />
                <StatCard icon={FaTimesCircle} tom="gray" rotulo="Baixados" valor={resumo.data?.baixados.quantidade ?? 0} detalhe={brl(resumo.data?.baixados.valor ?? 0)} ativo={situacao === 'BAIXADO'} onClick={() => { setSituacao(situacao === 'BAIXADO' ? '' : 'BAIXADO'); setPage(1); }} />
            </StatGrid>

            <Filtros>
                <div className="busca">
                    <FilterInput
                        label="Buscar"
                        placeholder="Nome, CPF/CNPJ ou número do boleto"
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="situacao">
                    <FilterSelect label="Situação" options={SITUACOES} value={situacao} onChange={(e) => { setSituacao(e.target.value); setPage(1); }} />
                </div>
                <div style={{ opacity: usaPeriodo ? 1 : 0.5 }}>
                    <Muted style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Vencimento{usaPeriodo ? '' : ' (ignorado na busca)'}</Muted>
                    <SeletorPeriodo de={periodo.de} ate={periodo.ate} onChange={(p) => { setPeriodo(p); setPage(1); }} modos={['mes', 'ano', 'tudo']} />
                </div>
            </Filtros>

            {marcados.length > 0 && (
                <BarraSelecao>
                    <span>{marcados.length} selecionado(s)</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Por folha
                        <select value={porFolha} onChange={(e) => setPorFolha(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${colors.border}` }}>
                            <option value="1">1 boleto</option>
                            <option value="3">3 boletos</option>
                        </select>
                    </label>
                    <Button size="sm" icon={<FaPrint />} loading={imprimindo} onClick={() => imprimir(marcados)}>Imprimir (PDF único)</Button>
                    <Button size="sm" variant="secondary" icon={<FaSyncAlt />} loading={atualizando} onClick={atualizarSelecionados}>Atualizar no banco</Button>
                    <Button size="sm" variant="ghost" onClick={() => setMarcados([])}>Limpar seleção</Button>
                </BarraSelecao>
            )}

            {lista.error ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : (
                <>
                    <DataTable
                        columns={colunas}
                        rows={linhas}
                        loading={lista.isLoading}
                        sort={sort}
                        onSort={alternarOrdem}
                        onRowClick={(l) => setLancamentoAberto(l.id)}
                        emptyTitle="Nenhum boleto encontrado"
                        emptyDescription="Ajuste a pesquisa ou o período."
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label={lista.isFetching ? 'atualizando…' : 'boletos'} />
                    {lista.data?.totais && (
                        <p style={{ marginTop: 8 }}><Muted>Total do filtro: {brl(lista.data.totais.valor)} em {lista.data.totais.quantidade} boleto(s) · pago: {brl(lista.data.totais.pago)}</Muted></p>
                    )}
                </>
            )}

            {lancamentoAberto && <LancamentoDialog id={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}
            {gerenciando && (
                <GerenciarBoletoDialog
                    lancamento={{ id: gerenciando.id, descricao: gerenciando.descricao, valor: gerenciando.valor, status: gerenciando.statusLancamento, dataVencimento: gerenciando.dataVencimento }}
                    onClose={() => setGerenciando(null)}
                />
            )}
        </>
    );
}

// ── Consulta direta no banco ─────────────────────────────────────────────────

function ConsultaNoBanco() {
    const [nosso, setNosso] = useState('');
    const [referencia, setReferencia] = useState('');
    const [dia, setDia] = useState(hojeIso());
    const [lancamentoAberto, setLancamentoAberto] = useState(null);

    const consultar = useMutation({
        mutationFn: (params) => sicrediApi.consultarBoleto(params),
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const liquidados = useQuery({
        queryKey: ['sicredi', 'liquidados', dia],
        queryFn: () => sicrediApi.liquidados(dia),
        enabled: false,
        retry: false,
    });

    const resultado = consultar.data;

    return (
        <>
            <Card>
                <SectionTitle icon={FaSearch} tom="blue">Consultar um boleto no Sicredi</SectionTitle>
                <Grid $cols={2}>
                    <div>
                        <FilterInput label="Nosso número (9 dígitos)" value={nosso} maxLength={9} onChange={(e) => setNosso(e.target.value.replace(/\D/g, ''))} />
                        <Button style={{ marginTop: 8 }} size="sm" disabled={nosso.length !== 9} loading={consultar.isPending} onClick={() => consultar.mutate({ nossoNumero: nosso })}>Consultar</Button>
                    </div>
                    <div>
                        <FilterInput label="Seu número ou ID do título" value={referencia} maxLength={25} onChange={(e) => setReferencia(e.target.value.trim())} />
                        <Button
                            style={{ marginTop: 8 }}
                            size="sm"
                            variant="secondary"
                            disabled={!referencia}
                            loading={consultar.isPending}
                            onClick={() => consultar.mutate(referencia.length <= 10 ? { seuNumero: referencia } : { idTituloEmpresa: referencia })}
                        >
                            Procurar título
                        </Button>
                    </div>
                </Grid>

                {resultado?.tipo === 'NOSSO_NUMERO' && (
                    <div style={{ marginTop: 16 }}>
                        <Row>
                            <Badge $tone={TOM[resultado.situacao.codigo] ?? 'neutral'}>{resultado.situacao.rotulo}</Badge>
                            <Muted>{resultado.boleto.situacao}</Muted>
                        </Row>
                        <Grid $cols={3} style={{ marginTop: 10 }}>
                            <KeyValue label="Nosso número">{resultado.boleto.nossoNumero}</KeyValue>
                            <KeyValue label="Seu número">{resultado.boleto.seuNumero}</KeyValue>
                            <KeyValue label="Valor">{resultado.boleto.valorNominal !== undefined ? brl(resultado.boleto.valorNominal) : ''}</KeyValue>
                            <KeyValue label="Vencimento">{resultado.boleto.dataVencimento ? dataBr(resultado.boleto.dataVencimento) : ''}</KeyValue>
                            <KeyValue label="Pagador">{resultado.boleto.pagador?.nome}</KeyValue>
                            <KeyValue label="Linha digitável">{resultado.boleto.linhaDigitavel}</KeyValue>
                        </Grid>
                        {resultado.boleto.dadosLiquidacao && (
                            <p style={{ marginTop: 10 }}><Badge $tone="success">Liquidado</Badge> <Muted>{brl(resultado.boleto.dadosLiquidacao.valor ?? 0)} em {dataHoraBr(resultado.boleto.dadosLiquidacao.data)}</Muted></p>
                        )}
                        <p style={{ marginTop: 10 }}>
                            {resultado.lancamento ? (
                                <Button size="sm" variant="secondary" onClick={() => setLancamentoAberto(resultado.lancamento.id)}>Abrir lançamento: {resultado.lancamento.descricao}</Button>
                            ) : (
                                <Muted>Este boleto não está vinculado a nenhum lançamento do sistema.</Muted>
                            )}
                        </p>
                    </div>
                )}

                {resultado?.tipo === 'REFERENCIA' && (
                    <div style={{ marginTop: 16 }}>
                        {resultado.titulos.length === 0 ? (
                            <Muted>Nenhum título encontrado com essa referência.</Muted>
                        ) : (
                            resultado.titulos.map((t) => (
                                <Grid key={t.linhaDigitavel ?? t.seuNumero} $cols={3} style={{ marginBottom: 10 }}>
                                    <KeyValue label="Seu número">{t.seuNumero}</KeyValue>
                                    <KeyValue label="ID do título">{t.idTituloEmpresa}</KeyValue>
                                    <KeyValue label="Valor">{t.valorNominal !== undefined ? brl(t.valorNominal) : ''}</KeyValue>
                                    <KeyValue label="Pagador">{t.pagador?.nome}</KeyValue>
                                    <KeyValue label="Linha digitável">{t.linhaDigitavel}</KeyValue>
                                </Grid>
                            ))
                        )}
                    </div>
                )}
            </Card>

            <Card>
                <SectionTitle icon={FaCheckCircle} tom="green">Liquidados no dia (segundo o banco)</SectionTitle>
                <Row style={{ alignItems: 'flex-end' }}>
                    <div style={{ width: 200 }}>
                        <FilterInput label="Dia" type="date" max={hojeIso()} value={dia} onChange={(e) => setDia(e.target.value)} />
                    </div>
                    <Button size="sm" loading={liquidados.isFetching} onClick={() => liquidados.refetch()}>Buscar no banco</Button>
                </Row>

                {liquidados.error && <ErrorBlock message={errorMessage(liquidados.error)} />}
                {liquidados.isFetching && <LoadingBlock />}
                {liquidados.data && !liquidados.isFetching && (
                    <div style={{ marginTop: 12 }}>
                        <DataTable
                            rows={liquidados.data.items.map((i) => ({ ...i, id: i.nossoNumero }))}
                            emptyTitle="Nenhuma liquidação nesse dia"
                            columns={[
                                {
                                    key: 'p',
                                    header: 'Pagador',
                                    render: (i) => (
                                        <div>
                                            <strong>{i.pagador?.nome ?? 'Não identificado'}</strong>
                                            {i.pagador?.documento && <div><Muted>{i.pagador.documento}</Muted></div>}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'n',
                                    header: 'Nº do boleto',
                                    render: (i) => (
                                        <div>
                                            <code>{i.nossoNumero}</code>
                                            {i.seuNumero && <div><Muted>{i.seuNumero}</Muted></div>}
                                        </div>
                                    ),
                                },
                                { key: 've', header: 'Vencimento', render: (i) => (i.dataVencimento ? formatDate(i.dataVencimento) : '—') },
                                { key: 'v', header: 'Valor liquidado', render: (i) => <strong>{brl(i.valorLiquidado)}</strong> },
                                { key: 't', header: 'Meio', render: (i) => i.tipoLiquidacao },
                                {
                                    key: 'l',
                                    header: 'Lançamento',
                                    render: (i) => (i.lancamento
                                        ? <Button size="sm" variant="ghost" onClick={() => setLancamentoAberto(i.lancamento.id)}>{i.lancamento.cliente?.nome ?? i.lancamento.descricao}</Button>
                                        : <Badge $tone="warning">Sem lançamento</Badge>),
                                },
                            ]}
                        />
                    </div>
                )}
            </Card>

            {lancamentoAberto && <LancamentoDialog id={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}
        </>
    );
}

/** Pesquisa, impressão e consulta de boletos emitidos no Sicredi. */
export default function Boletos() {
    const [aba, setAba] = useState('noBanco');
    const [conciliando, setConciliando] = useState(false);

    const abas = useMemo(
        () => [
            { id: 'noBanco', label: 'No banco (em aberto e pagos)', icon: <FaBarcode /> },
            { id: 'meus', label: 'Emitidos pelo sistema', icon: <FaBarcode /> },
            { id: 'banco', label: 'Consulta e liquidados', icon: <FaSearch /> },
        ],
        [],
    );

    return (
        <Page>
            <PageHeader
                icon={FaBarcode}
                tone="blue"
                title="Boletos"
                subtitle="Boletos do Sicredi."
                actions={<Button variant="secondary" icon={<FaSyncAlt />} onClick={() => setConciliando(true)}>Conciliar com Sicredi</Button>}
            />

            <Tabs tabs={abas} value={aba} onChange={setAba} />

            {aba === 'noBanco' && <BoletosDoBanco />}
            {aba === 'meus' && <MeusBoletos />}
            {aba === 'banco' && <ConsultaNoBanco />}

            {conciliando && <ConciliarDialog onClose={() => setConciliando(false)} />}
        </Page>
    );
}
