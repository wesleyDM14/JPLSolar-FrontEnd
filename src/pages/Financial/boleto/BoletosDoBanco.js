import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaLink, FaPlus, FaEyeSlash, FaPrint, FaSearch, FaSyncAlt, FaUndo, FaUnlink } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { financeiroApi, imprimirBoletosDoBanco, sicrediApi } from '../../../api/resources';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { usePostosExtras } from '../../../hooks/usePostosExtras';
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    Dialog,
    ErrorBlock,
    FilterInput,
    FilterSelect,
    LoadingBlock,
    Muted,
    PaginationBar,
    Row,
    SectionTitle,
    StatCard,
    StatGrid,
    tokens,
} from '../../../ui';
import { dataHoraBr } from '../../../utils/datas';
import { formatDate } from '../../../utils/masks';
import { brl } from '../format';
import LancamentoDialog from '../LancamentoDialog';
import GerenciarBoletoDialog from './GerenciarBoletoDialog';
import VinculoAutomaticoDialog from './VinculoAutomaticoDialog';

const { colors } = tokens;

const PAGE_SIZE = 20;

const GRUPOS = [
    { value: 'abertos', label: 'Em aberto' },
    { value: 'pagos', label: 'Pagos' },
    { value: 'encerrados', label: 'Baixados / rejeitados' },
    { value: 'todos', label: 'Todos' },
];

const VINCULOS = [
    { value: 'nao', label: 'Sem lançamento' },
    { value: 'sim', label: 'Com lançamento' },
    { value: 'ocultos', label: 'Ocultos (escondidos da lista)' },
];

const SITUACAO = {
    EM_CARTEIRA: { rotulo: 'A vencer', tom: 'info' },
    VENCIDO: { rotulo: 'Vencido', tom: 'danger' },
    LIQUIDADO: { rotulo: 'Pago', tom: 'success' },
    BAIXADO: { rotulo: 'Baixado', tom: 'neutral' },
    BAIXA_PENDENTE: { rotulo: 'Baixa solicitada', tom: 'warning' },
    PROTESTO: { rotulo: 'Em protesto', tom: 'warning' },
    NEGATIVACAO: { rotulo: 'Negativado', tom: 'warning' },
    REJEITADO: { rotulo: 'Rejeitado', tom: 'danger' },
    DESCONHECIDA: { rotulo: 'Desconhecida', tom: 'neutral' },
};

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

    select {
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid ${colors.border};
        background: ${colors.surface};
        color: ${colors.text};
    }
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

    > .campo {
        width: 190px;
    }
`;

const Sugestao = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 8px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surface};

    > div {
        min-width: 0;
    }
`;

const documentoFormatado = (documento) => {
    const d = String(documento ?? '').replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return documento ?? '';
};

// ── Busca no banco (varredura do nosso número) ───────────────────────────────

function BuscaNoBanco({ onConcluida }) {
    const [refazer, setRefazer] = useState(false);
    const [somenteExtras, setSomenteExtras] = useState(true);
    const extras = usePostosExtras();

    const estado = useQuery({
        queryKey: ['sicredi', 'descoberta'],
        queryFn: sicrediApi.descoberta,
        refetchInterval: (query) => (query.state.data?.emAndamento ? 2000 : false),
    });

    const iniciar = useMutation({
        mutationFn: () => sicrediApi.iniciarDescoberta({ completo: refazer, postos: extras.postos.length ? extras.postos : undefined, somentePostos: somenteExtras && extras.postos.length > 0 }),
        onSuccess: () => estado.refetch(),
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const cancelar = useMutation({
        mutationFn: sicrediApi.cancelarDescoberta,
        onSuccess: () => estado.refetch(),
    });

    const dados = estado.data;
    const emAndamento = Boolean(dados?.emAndamento);

    // Ao terminar, recarrega a lista.
    const [jaAvisou, setJaAvisou] = useState(null);
    useEffect(() => {
        if (dados && !dados.emAndamento && dados.terminouEm && jaAvisou !== dados.terminouEm) {
            if (jaAvisou !== null) {
                onConcluida();
                toast.success(dados.erro ? `Busca interrompida: ${dados.erro}` : `Busca concluída: ${dados.encontrados} boleto(s), ${dados.novos} novo(s).`);
            }
            setJaAvisou(dados.terminouEm);
        } else if (dados && jaAvisou === null && !dados.terminouEm) {
            setJaAvisou('inicial');
        }
    }, [dados, jaAvisou, onConcluida]);

    return (
        <Card>
            <SectionTitle icon={FaSearch} tom="blue">Boletos do Sicredi</SectionTitle>
            <Row style={{ alignItems: 'center' }}>
                {emAndamento ? (
                    <Button variant="secondary" loading={cancelar.isPending} onClick={() => cancelar.mutate()}>Parar busca</Button>
                ) : (
                    <Button icon={<FaSearch />} loading={iniciar.isPending} onClick={() => iniciar.mutate()}>Buscar boletos em aberto e pagos</Button>
                )}
                {!emAndamento && (
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={refazer} onChange={(e) => setRefazer(e.target.checked)} />
                        Refazer tudo
                    </label>
                )}
                {!emAndamento && extras.postos.length > 0 && (
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={somenteExtras} onChange={(e) => setSomenteExtras(e.target.checked)} />
                        Pesquisar só {extras.postos.length > 1 ? 'esses postos' : `o posto ${extras.postos[0]}`}
                    </label>
                )}
                {!emAndamento && (
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem' }} title="Outros postos do convênio onde boletos antigos foram emitidos. Separe por vírgula.">
                        Outros postos
                        <input
                            value={extras.texto}
                            onChange={(e) => extras.alterar(e.target.value)}
                            placeholder="ex.: 08"
                            style={{ width: 90, padding: '6px 8px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}
                        />
                    </label>
                )}
            </Row>

            {dados && (emAndamento || dados.terminouEm) && (
                <p style={{ marginTop: 12 }}>
                    {emAndamento ? (
                        <>
                            <Badge $tone="info">Buscando…</Badge>{' '}
                            <Muted>
                                {dados.postos?.length > 0 ? `posto ${dados.postoAtual ?? dados.postos[0]} · ` : ''}
                                {dados.encontrados} boletos encontrados · {dados.novos} novos · {dados.consultados} consultados
                            </Muted>
                        </>
                    ) : (
                        <>
                            <Badge $tone={dados.erro ? 'danger' : 'success'}>{dados.erro ? 'Interrompida' : 'Concluída'}</Badge>{' '}
                            <Muted>
                                {dataHoraBr(dados.terminouEm)} · {dados.encontrados} boletos · {dados.novos} novos
                                {dados.erro ? ` · ${dados.erro}` : ''}
                                {dados.porPosto
                                    ? ` · ${Object.entries(dados.porPosto).map(([posto, r]) => `posto ${posto}: ${r.encontrados}`).join(', ')}`
                                    : ''}
                            </Muted>
                        </>
                    )}
                </p>
            )}
        </Card>
    );
}

// ── Vincular a um lançamento ─────────────────────────────────────────────────

function VincularDialog({ boleto, onClose, onFeito }) {
    const queryClient = useQueryClient();
    const [busca, setBusca] = useState('');
    const termo = useDebouncedValue(busca);
    const [forcar, setForcar] = useState(null); // { lancamento, mensagem }
    const [criando, setCriando] = useState(false);
    const [descricao, setDescricao] = useState('');

    const sugestoes = useQuery({
        queryKey: ['financeiro', 'boletos', 'banco', 'sugestoes', boleto.nossoNumero],
        queryFn: () => financeiroApi.boletoBancoSugestoes(boleto.nossoNumero),
    });

    const pesquisa = useQuery({
        queryKey: ['financeiro', 'lancamentos', 'para-vincular', termo],
        queryFn: () => financeiroApi.lancamentos({ tipo: 'RECEBER', boleto: 'SEM_BOLETO', search: termo.trim(), pageSize: 10 }),
        enabled: termo.trim().length >= 2,
    });

    const concluir = async (resposta) => {
        await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
        const baixa = resposta?.baixa;
        toast.success(baixa && baixa !== 'IGNORADO' ? 'Boleto vinculado e pagamento registrado no lançamento.' : 'Boleto vinculado ao lançamento.');
        onFeito();
    };

    const vincular = useMutation({
        mutationFn: ({ lancamento, forcar: f }) => financeiroApi.boletoBancoVincular(boleto.nossoNumero, { lancamentoId: lancamento.id, forcar: Boolean(f) }),
        onSuccess: concluir,
        onError: (erro, variaveis) => {
            if (erro?.response?.data?.code === 'VALOR_DIFERENTE') {
                setForcar({ lancamento: variaveis.lancamento, mensagem: errorMessage(erro) });
                return;
            }
            toast.error(errorMessage(erro));
        },
    });

    const criar = useMutation({
        mutationFn: () => financeiroApi.boletoBancoCriarLancamento(boleto.nossoNumero, { descricao: descricao.trim() || undefined }),
        onSuccess: async (resposta) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(resposta.clienteEncontrado ? 'Lançamento criado.' : 'Lançamento criado sem cliente (pagador nas observações).');
            onFeito();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const linhaLancamento = (l) => (
        <Sugestao key={l.id}>
            <div>
                <strong>{l.cliente?.nome ?? 'Sem cliente'}</strong>
                <div>
                    <Muted>
                        {l.descricao} · vence {formatDate(l.dataVencimento)} · {brl(l.valor)}
                        {l.motivos?.length ? ` · ${l.motivos.join(', ')}` : ''}
                    </Muted>
                </div>
                {String(l.dataVencimento).slice(0, 10) !== String(boleto.dataVencimento).slice(0, 10) && boleto.dataVencimento && (
                    <div><Badge $tone="warning">Vencimento passa a ser {formatDate(boleto.dataVencimento)} (o do boleto)</Badge></div>
                )}
            </div>
            <Button size="sm" icon={<FaLink />} loading={vincular.isPending && vincular.variables?.lancamento.id === l.id} onClick={() => vincular.mutate({ lancamento: l })}>
                Vincular
            </Button>
        </Sugestao>
    );

    const resultados = (pesquisa.data?.data ?? []).map((l) => ({
        id: l.id,
        descricao: l.descricao,
        valor: Number(l.valor),
        dataVencimento: l.dataVencimento,
        cliente: l.cliente,
    }));

    return (
        <>
            <Dialog
                open
                width={720}
                title="Vincular boleto a um lançamento"
                subtitle={`${boleto.pagador?.nome ?? 'Pagador não identificado'} · ${brl(boleto.valor)} · vence ${formatDate(boleto.dataVencimento)} · nº ${boleto.nossoNumeroFormatado}`}
                onClose={onClose}
                footer={<Button variant="secondary" onClick={onClose}>Fechar</Button>}
            >
                <strong>Sugestões</strong>
                <div style={{ marginTop: 8 }}>
                    {sugestoes.isLoading && <LoadingBlock />}
                    {sugestoes.error && <ErrorBlock message={errorMessage(sugestoes.error)} onRetry={sugestoes.refetch} />}
                    {sugestoes.data?.length === 0 && <Muted>Nenhuma sugestão.</Muted>}
                    {(sugestoes.data ?? []).map(linhaLancamento)}
                </div>

                <div style={{ marginTop: 16 }}>
                    <FilterInput label="Procurar outro lançamento a receber" placeholder="Nome do cliente ou descrição" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    <div style={{ marginTop: 8 }}>
                        {pesquisa.isFetching && <LoadingBlock />}
                        {termo.trim().length >= 2 && !pesquisa.isFetching && resultados.length === 0 && <Muted>Nada encontrado.</Muted>}
                        {resultados.map(linhaLancamento)}
                    </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
                    <strong>Sem lançamento?</strong>
                    <div style={{ height: 8 }} />
                    {criando ? (
                        <>
                            <FilterInput label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={`Boleto — ${boleto.pagador?.nome ?? boleto.nossoNumeroFormatado}`} />
                            <Row style={{ marginTop: 8 }}>
                                <Button icon={<FaPlus />} loading={criar.isPending} onClick={() => criar.mutate()}>Criar e vincular</Button>
                                <Button variant="ghost" onClick={() => setCriando(false)}>Cancelar</Button>
                            </Row>
                        </>
                    ) : (
                        <Button variant="secondary" icon={<FaPlus />} onClick={() => setCriando(true)}>Criar lançamento a partir do boleto</Button>
                    )}
                </div>
            </Dialog>

            <ConfirmDialog
                open={Boolean(forcar)}
                title="Valores diferentes"
                message={forcar?.mensagem}
                confirmLabel="Vincular mesmo assim"
                loading={vincular.isPending}
                onConfirm={() => vincular.mutate({ lancamento: forcar.lancamento, forcar: true }, { onSettled: () => setForcar(null) })}
                onClose={() => setForcar(null)}
            />
        </>
    );
}

// ── Lista ────────────────────────────────────────────────────────────────────

export default function BoletosDoBanco() {
    const queryClient = useQueryClient();
    const [grupo, setGrupo] = useState('abertos');
    const [vinculo, setVinculo] = useState('');
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ field: 'dataVencimento', direction: 'asc' });
    const [marcados, setMarcados] = useState([]);
    const [porFolha, setPorFolha] = useState('3');
    const [imprimindo, setImprimindo] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [vinculando, setVinculando] = useState(null);
    const [desvinculando, setDesvinculando] = useState(null);
    const [lancamentoAberto, setLancamentoAberto] = useState(null);
    const [gerenciando, setGerenciando] = useState(null);
    const [vinculoAutomatico, setVinculoAutomatico] = useState(false);

    const termo = useDebouncedValue(busca);
    const ocultos = vinculo === 'ocultos';
    const params = { grupo, vinculo: vinculo && !ocultos ? vinculo : undefined, ocultos: ocultos ? 'true' : undefined, search: termo.trim() || undefined, page, pageSize: PAGE_SIZE, sort: `${sort.field}:${sort.direction}` };

    const alternarOrdem = (campo) => {
        setPage(1);
        setSort((atual) => (atual.field === campo ? { field: campo, direction: atual.direction === 'asc' ? 'desc' : 'asc' } : { field: campo, direction: campo.startsWith('data') ? 'desc' : 'asc' }));
    };

    const resumo = useQuery({ queryKey: ['financeiro', 'boletos', 'banco', 'resumo'], queryFn: financeiroApi.boletosBancoResumo });
    const lista = useQuery({
        queryKey: ['financeiro', 'boletos', 'banco', params],
        queryFn: () => financeiroApi.boletosBanco(params),
        placeholderData: (anterior) => anterior,
    });

    const linhas = (lista.data?.data ?? []).map((b) => ({ ...b, id: b.nossoNumero }));
    const todosMarcados = linhas.length > 0 && linhas.every((l) => marcados.includes(l.nossoNumero));
    const recarregar = () => queryClient.invalidateQueries({ queryKey: ['financeiro', 'boletos'] });

    const alternar = (nn) => setMarcados((atual) => (atual.includes(nn) ? atual.filter((x) => x !== nn) : [...atual, nn]));
    const alternarTodos = () =>
        setMarcados((atual) => (todosMarcados ? atual.filter((nn) => !linhas.some((l) => l.nossoNumero === nn)) : [...new Set([...atual, ...linhas.map((l) => l.nossoNumero)])]));

    const imprimir = async () => {
        setImprimindo(true);
        try {
            const falhas = await imprimirBoletosDoBanco(marcados, Number(porFolha));
            if (falhas.length > 0) {
                toast(`${falhas.length} boleto(s) ficaram de fora: ${falhas.slice(0, 3).map((f) => `${f.descricao} (${f.motivo})`).join('; ')}`, { duration: 8000 });
            }
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível reunir os boletos.'));
        } finally {
            setImprimindo(false);
        }
    };

    const atualizarSelecionados = async () => {
        setAtualizando(true);
        let falhas = 0;
        for (const nn of marcados) {
            try {
                await financeiroApi.boletoBancoAtualizar(nn);
            } catch {
                falhas++;
            }
        }
        await recarregar();
        setAtualizando(false);
        toast.success(`${marcados.length - falhas} consultado(s) no banco${falhas ? `, ${falhas} com erro` : ''}.`);
    };

    const desvincular = useMutation({
        mutationFn: (nn) => financeiroApi.boletoBancoDesvincular(nn),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Boleto desvinculado.');
            setDesvinculando(null);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const ocultar = useMutation({
        mutationFn: ({ nossoNumero, ocultar: esconder }) => financeiroApi.boletoBancoOcultar(nossoNumero, esconder),
        onSuccess: async (_resposta, { ocultar: esconder }) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(esconder ? 'Boleto oculto. Ele não aparece mais na lista nem gera avisos.' : 'Boleto voltou para a lista.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const colunas = [
        {
            key: 'marcar',
            header: <Marcar type="checkbox" aria-label="Marcar todos" checked={todosMarcados} onChange={alternarTodos} />,
            width: 40,
            render: (l) => <Marcar type="checkbox" aria-label="Marcar boleto" checked={marcados.includes(l.nossoNumero)} onChange={() => alternar(l.nossoNumero)} />,
        },
        {
            key: 'pagador',
            header: 'Pagador',
            sortKey: 'pagador',
            minWidth: 280,
            render: (l) => (
                <div style={{ lineHeight: 1.35 }}>
                    <strong style={{ fontWeight: 600 }}>{l.pagador?.nome ?? 'Pagador não identificado'}</strong>
                    <div><Muted style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{documentoFormatado(l.pagador?.documento)}</Muted></div>
                </div>
            ),
        },
        {
            key: 'numeros',
            header: 'Nº do boleto',
            sortKey: 'nossoNumero',
            nowrap: true,
            render: (l) => (
                <div>
                    <code>{l.nossoNumeroFormatado}</code>
                    {l.seuNumero && <div><Muted>{l.seuNumero}</Muted></div>}
                </div>
            ),
        },
        { key: 'vencimento', header: 'Vencimento', sortKey: 'dataVencimento', nowrap: true, render: (l) => formatDate(l.dataVencimento) },
        { key: 'emissao', header: 'Emissão', sortKey: 'dataEmissao', nowrap: true, render: (l) => (l.dataEmissao ? formatDate(l.dataEmissao) : '—') },
        // "Pago em" só faz sentido fora da lista de abertos.
        ...(grupo === 'abertos' ? [] : [{ key: 'pagoEm', header: 'Pago em', sortKey: 'dataLiquidacao', nowrap: true, render: (l) => (l.dataLiquidacao ? formatDate(l.dataLiquidacao) : '—') }]),
        {
            key: 'valor',
            header: 'Valor',
            sortKey: 'valor',
            render: (l) => {
                const extras = [
                    l.encargos?.juros > 0 && `juros ${brl(l.encargos.juros)}`,
                    l.encargos?.multa > 0 && `multa ${brl(l.encargos.multa)}`,
                    l.encargos?.desconto > 0 && `desconto ${brl(l.encargos.desconto)}`,
                    l.encargos?.abatimento > 0 && `abatimento ${brl(l.encargos.abatimento)}`,
                ].filter(Boolean);
                const pagoDiferente = l.valorLiquidado !== null && l.valorLiquidado !== undefined && Math.abs(l.valorLiquidado - l.valor) > 0.009;

                return (
                    <div>
                        <strong>{brl(l.valor)}</strong>
                        {l.situacao === 'LIQUIDADO' && l.valorLiquidado !== null && pagoDiferente && (
                            <div><Muted style={{ fontSize: '0.78rem' }}>pago {brl(l.valorLiquidado)}{extras.length ? ` (${extras.join(', ')})` : ''}</Muted></div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'situacao',
            header: 'Situação',
            sortKey: 'situacao',
            render: (l) => {
                const s = SITUACAO[l.situacao] ?? SITUACAO.DESCONHECIDA;
                return (
                    <div>
                        <Badge $tone={s.tom}>{s.rotulo}</Badge>
                        {l.dataLiquidacao && <div><Muted style={{ fontSize: '0.75rem' }}>pago em {formatDate(l.dataLiquidacao)}</Muted></div>}
                    </div>
                );
            },
        },
        {
            key: 'lancamento',
            header: 'Lançamento',
            render: (l) =>
                l.lancamento ? (
                    <button
                        type="button"
                        onClick={() => setLancamentoAberto(l.lancamento.id)}
                        title={`Abrir lançamento: ${l.lancamento.descricao}`}
                        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                    >
                        <Badge $tone="success">Vinculado</Badge>
                        <div>
                            <Muted style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                {l.lancamento.parcelaTotal ? `parcela ${l.lancamento.parcelaNumero}/${l.lancamento.parcelaTotal}` : brl(l.lancamento.valor)}
                            </Muted>
                        </div>
                    </button>
                ) : (
                    <Badge $tone="warning">Sem lançamento</Badge>
                ),
        },
        {
            key: 'acoes',
            header: '',
            width: 190,
            nowrap: true,
            render: (l) => (
                <Row $justify="flex-end" $wrap={false}>
                    <Button size="sm" variant="secondary" onClick={() => setGerenciando(l)}>Gerenciar</Button>
                    {l.lancamento ? (
                        <Button size="sm" variant="ghost" icon={<FaUnlink />} title="Desvincular do lançamento" aria-label="Desvincular do lançamento" onClick={() => setDesvinculando(l)} />
                    ) : ocultos ? (
                        <Button size="sm" variant="secondary" icon={<FaUndo />} title="Voltar para a lista" aria-label="Voltar para a lista" loading={ocultar.isPending} onClick={() => ocultar.mutate({ nossoNumero: l.nossoNumero, ocultar: false })} />
                    ) : (
                        <>
                            <Button size="sm" variant="secondary" icon={<FaLink />} title="Vincular a um lançamento" aria-label="Vincular a um lançamento" onClick={() => setVinculando(l)} />
                            <Button size="sm" variant="ghost" icon={<FaEyeSlash />} title="Ocultar da lista (ex.: boleto de teste)" aria-label="Ocultar da lista" loading={ocultar.isPending} onClick={() => ocultar.mutate({ nossoNumero: l.nossoNumero, ocultar: true })} />
                        </>
                    )}
                </Row>
            ),
        },
    ];

    const escolher = (g) => {
        setGrupo(g);
        setPage(1);
        setMarcados([]);
    };

    return (
        <>
            <BuscaNoBanco onConcluida={recarregar} />

            <StatGrid>
                <StatCard
                    icon={FaClock}
                    tom="blue"
                    rotulo="Em aberto no banco"
                    valor={resumo.data?.abertos.quantidade ?? 0}
                    detalhe={`${brl(resumo.data?.abertos.valor ?? 0)} · ${resumo.data?.abertos.vencidos ?? 0} vencido(s)`}
                    ativo={grupo === 'abertos' && !vinculo}
                    onClick={() => { escolher('abertos'); setVinculo(''); }}
                />
                <StatCard
                    icon={FaExclamationTriangle}
                    tom="orange"
                    rotulo="Em aberto sem lançamento"
                    valor={resumo.data?.abertos.semLancamento ?? 0}
                    detalhe="a vincular"
                    ativo={grupo === 'abertos' && vinculo === 'nao'}
                    onClick={() => { escolher('abertos'); setVinculo('nao'); }}
                />
                <StatCard
                    icon={FaCheckCircle}
                    tom="green"
                    rotulo="Pagos"
                    valor={resumo.data?.pagos.quantidade ?? 0}
                    detalhe={`${brl(resumo.data?.pagos.valor ?? 0)} · ${resumo.data?.pagos.semLancamento ?? 0} sem lançamento`}
                    ativo={grupo === 'pagos'}
                    onClick={() => { escolher('pagos'); setVinculo(''); }}
                />
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
                <div className="campo">
                    <FilterSelect label="Situação" options={GRUPOS} placeholder={null} value={grupo} onChange={(e) => escolher(e.target.value)} />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                    <Button variant="secondary" icon={<FaLink />} onClick={() => setVinculoAutomatico(true)}>Vincular automaticamente</Button>
                </div>
                <div className="campo">
                    <FilterSelect label="Lançamento" options={VINCULOS} value={vinculo} onChange={(e) => { setVinculo(e.target.value); setPage(1); }} />
                </div>
            </Filtros>

            {marcados.length > 0 && (
                <BarraSelecao>
                    <span>{marcados.length} selecionado(s)</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Por folha
                        <select value={porFolha} onChange={(e) => setPorFolha(e.target.value)}>
                            <option value="1">1 boleto</option>
                            <option value="3">3 boletos</option>
                        </select>
                    </label>
                    <Button size="sm" icon={<FaPrint />} loading={imprimindo} onClick={imprimir}>Imprimir (PDF único)</Button>
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
                        emptyTitle="Nenhum boleto encontrado"
                        emptyDescription="Clique em “Buscar boletos” acima."
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label={lista.isFetching ? 'atualizando…' : 'boletos'} />
                </>
            )}

            {vinculoAutomatico && <VinculoAutomaticoDialog onClose={() => setVinculoAutomatico(false)} />}
            {gerenciando && <GerenciarBoletoDialog boletoBanco={gerenciando} onClose={() => setGerenciando(null)} />}
            {vinculando && <VincularDialog boleto={vinculando} onClose={() => setVinculando(null)} onFeito={() => { setVinculando(null); recarregar(); }} />}
            <ConfirmDialog
                open={Boolean(desvinculando)}
                title="Desvincular boleto"
                message={desvinculando ? `Desvincular o boleto ${desvinculando.nossoNumeroFormatado} de "${desvinculando.lancamento?.descricao ?? ''}"?` : ''}
                confirmLabel="Desvincular"
                loading={desvincular.isPending}
                onConfirm={() => desvincular.mutate(desvinculando.nossoNumero)}
                onClose={() => setDesvinculando(null)}
            />
            {lancamentoAberto && <LancamentoDialog id={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}
        </>
    );
}
