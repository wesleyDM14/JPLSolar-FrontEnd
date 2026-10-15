import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaLink, FaPlus, FaPrint, FaSearch, FaSyncAlt, FaUnlink } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { financeiroApi, imprimirBoletosDoBanco, sicrediApi } from '../../../api/resources';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
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
];

const SITUACAO = {
    EM_CARTEIRA: { rotulo: 'Em carteira', tom: 'info' },
    VENCIDO: { rotulo: 'Vencido', tom: 'danger' },
    LIQUIDADO: { rotulo: 'Pago', tom: 'success' },
    BAIXADO: { rotulo: 'Baixado', tom: 'neutral' },
    BAIXA_PENDENTE: { rotulo: 'Baixa pendente', tom: 'warning' },
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

    const estado = useQuery({
        queryKey: ['sicredi', 'descoberta'],
        queryFn: sicrediApi.descoberta,
        refetchInterval: (query) => (query.state.data?.emAndamento ? 2000 : false),
    });

    const iniciar = useMutation({
        mutationFn: () => sicrediApi.iniciarDescoberta({ completo: refazer }),
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
            </Row>

            {dados && (emAndamento || dados.terminouEm) && (
                <p style={{ marginTop: 12 }}>
                    {emAndamento ? (
                        <>
                            <Badge $tone="info">Buscando…</Badge>{' '}
                            <Muted>{dados.encontrados} boletos encontrados · {dados.novos} novos · {dados.consultados} consultados</Muted>
                        </>
                    ) : (
                        <>
                            <Badge $tone={dados.erro ? 'danger' : 'success'}>{dados.erro ? 'Interrompida' : 'Concluída'}</Badge>{' '}
                            <Muted>
                                {dataHoraBr(dados.terminouEm)} · {dados.encontrados} boletos · {dados.novos} novos
                                {dados.erro ? ` · ${dados.erro}` : ''}
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
    const [marcados, setMarcados] = useState([]);
    const [porFolha, setPorFolha] = useState('3');
    const [imprimindo, setImprimindo] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [vinculando, setVinculando] = useState(null);
    const [desvinculando, setDesvinculando] = useState(null);
    const [lancamentoAberto, setLancamentoAberto] = useState(null);

    const termo = useDebouncedValue(busca);
    const params = { grupo, vinculo: vinculo || undefined, search: termo.trim() || undefined, page, pageSize: PAGE_SIZE };

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
            render: (l) => (
                <div>
                    <strong>{l.pagador?.nome ?? 'Pagador não identificado'}</strong>
                    <div><Muted>{documentoFormatado(l.pagador?.documento)}</Muted></div>
                </div>
            ),
        },
        {
            key: 'numeros',
            header: 'Nº do boleto',
            render: (l) => (
                <div>
                    <code>{l.nossoNumeroFormatado}</code>
                    {l.seuNumero && <div><Muted>{l.seuNumero}</Muted></div>}
                </div>
            ),
        },
        { key: 'vencimento', header: 'Vencimento', render: (l) => formatDate(l.dataVencimento) },
        { key: 'valor', header: 'Valor', render: (l) => <strong>{brl(l.valor)}</strong> },
        {
            key: 'situacao',
            header: 'Situação',
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
                    <Button size="sm" variant="ghost" onClick={() => setLancamentoAberto(l.lancamento.id)}>
                        {l.lancamento.cliente?.nome ?? l.lancamento.descricao}
                    </Button>
                ) : (
                    <Badge $tone="warning">Sem lançamento</Badge>
                ),
        },
        {
            key: 'acoes',
            header: '',
            width: 150,
            render: (l) => (
                <Row $justify="flex-end" $wrap={false}>
                    {l.lancamento ? (
                        <Button size="sm" variant="ghost" icon={<FaUnlink />} onClick={() => setDesvinculando(l)}>Desvincular</Button>
                    ) : (
                        <Button size="sm" variant="secondary" icon={<FaLink />} onClick={() => setVinculando(l)}>Vincular</Button>
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
                    <FilterSelect label="Situação" options={GRUPOS} placeholder="Em aberto" value={grupo === 'abertos' ? '' : grupo} onChange={(e) => escolher(e.target.value || 'abertos')} />
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
                        emptyTitle="Nenhum boleto encontrado"
                        emptyDescription="Clique em “Buscar boletos” acima."
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={setPage} label={lista.isFetching ? 'atualizando…' : 'boletos'} />
                </>
            )}

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
