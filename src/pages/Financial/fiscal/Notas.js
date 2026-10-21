import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FaBolt,
    FaCalendarCheck,
    FaCheckCircle,
    FaCog,
    FaFileCode,
    FaFileImport,
    FaFileInvoiceDollar,
    FaFilePdf,
    FaListUl,
    FaPaperPlane,
    FaPlus,
    FaReceipt,
    FaSyncAlt,
    FaTimesCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { fiscalApi, openFileInTab, saveResponse } from '../../../api/resources';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
    Badge,
    Button,
    Card,
    DataTable,
    ErrorBlock,
    FilterInput,
    FilterSelect,
    Muted,
    Page,
    PageHeader,
    PaginationBar,
    SectionTitle,
    StatCard,
    StatGrid,
    tokens,
    tooltipTema,
} from '../../../ui';
import { formatCurrency, formatDate } from '../../../utils/masks';
import { anoAtual, fimDoAno, fimDoMes, hojeIso, inicioDoAno, inicioDoMes, mesAtual } from '../../../utils/datas';
import { BarraDeFiltros } from '../comuns';
import SeletorPeriodo from '../SeletorPeriodo';
import { mesCurto } from '../format';
import { STATUS_NOTA, TIPOS_NOTA, direcaoOptions, statusOptions, tipoOptions } from './formato';
import NotaDialog from './NotaDialog';
import { EmitirNotaDialog } from './EmitirNotaDialog';
import BuscarNotasDialog from './BuscarNotasDialog';
import { ImportarXmlDialog, NovaNotaDialog } from './NovaNotaDialogs';

const { colors } = tokens;

const Selecao = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px 14px;
    margin-bottom: 12px;
    border-radius: 12px;
    background: ${colors.infoBg};
    color: ${colors.info};
    font-weight: 700;
`;

const eixoMil = (v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} mil` : v);

/** Notas fiscais: emitidas e recebidas, vínculos com cliente/contrato/usina, XML em lote e envio ao contador. */
export default function Notas() {
    const navigate = useNavigate();
    const [filtros, setFiltros] = useState({ mes: mesAtual(), ano: '', tipo: '', direcao: '', status: '', semVinculo: '', enviada: '', search: '' });
    const [page, setPage] = useState(1);
    const [selecionadas, setSelecionadas] = useState([]);
    const [detalheId, setDetalheId] = useState(null);
    const [dialogo, setDialogo] = useState(null); // 'nova' | 'importar' | 'emitir'
    const [baixandoLote, setBaixandoLote] = useState(false);

    const busca = useDebouncedValue(filtros.search);
    const queryClient = useQueryClient();

    // A numeração (nota e RPS) é conferida com a prefeitura pelo servidor: aqui só se mostra.
    const config = useQuery({ queryKey: ['fiscal', 'configuracao'], queryFn: fiscalApi.configuracao });
    const ambienteAtual = config.data?.ambiente;

    // Só as notas do ambiente em uso (as de teste não se misturam às reais); notas sem ambiente aparecem sempre.
    const params = { ...filtros, search: busca, ambiente: ambienteAtual };

    // O resumo é mensal: em visão anual mostra o mês corrente (ou dezembro de anos passados).
    const mesDoResumo = filtros.mes || (filtros.ano && Number(filtros.ano) !== anoAtual() ? `${filtros.ano}-12` : mesAtual());
    const resumo = useQuery({ queryKey: ['fiscal', 'resumo', mesDoResumo], queryFn: () => fiscalApi.resumo(mesDoResumo) });
    const lista = useQuery({
        queryKey: ['fiscal', 'notas', params, page],
        queryFn: () => fiscalApi.notas({ ...params, page, pageSize: 15 }),
        placeholderData: (anterior) => anterior,
    });

    // Ao escolher um mês ou ano, confere a prefeitura e traz as notas que ela tem e o sistema não (inclusive as emitidas no portal).
    const sincronizados = useRef(new Set());
    const [sincronia, setSincronia] = useState({ estado: 'ocioso', texto: '' });

    const periodoDaTela = useCallback(() => {
        const limite = (data) => (data > hojeIso() ? hojeIso() : data);
        if (filtros.mes) return { de: `${filtros.mes}-01`, ate: limite(fimDoMes(`${filtros.mes}-01`)) };
        if (filtros.ano) return { de: `${filtros.ano}-01-01`, ate: limite(`${filtros.ano}-12-31`) };
        return null;
    }, [filtros.mes, filtros.ano]);

    const sincronizar = useCallback(
        async (forcar = false) => {
            const periodo = periodoDaTela();
            if (!periodo || !ambienteAtual || periodo.de > hojeIso()) {
                setSincronia({ estado: 'ocioso', texto: '' });
                return;
            }
            const chave = `${ambienteAtual}:${periodo.de}:${periodo.ate}`;
            if (!forcar && sincronizados.current.has(chave)) return;
            sincronizados.current.add(chave);

            setSincronia({ estado: 'buscando', texto: 'Conferindo as notas na prefeitura…' });
            try {
                const resposta = await fiscalApi.buscarNotas({ ...periodo, ambiente: ambienteAtual });
                const novas = resposta.importadas + resposta.canceladasAtualizadas;
                setSincronia({
                    estado: 'ok',
                    texto: resposta.importadas > 0 ? `${resposta.importadas} nota(s) trazida(s) da prefeitura.` : `Conferido com a prefeitura (${resposta.encontradas} nota(s) no período).`,
                });
                if (novas > 0) queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            } catch (erro) {
                sincronizados.current.delete(chave);
                setSincronia({ estado: 'erro', texto: errorMessage(erro, 'Não foi possível conferir com a prefeitura.') });
            }
        },
        [ambienteAtual, periodoDaTela, queryClient],
    );

    useEffect(() => {
        sincronizar(false);
    }, [sincronizar]);

    const alterar = (campo) => (e) => {
        setFiltros((atual) => ({ ...atual, [campo]: e.target.value }));
        setPage(1);
        setSelecionadas([]);
    };

    const linhas = lista.data?.data ?? [];
    const todasMarcadas = linhas.length > 0 && linhas.every((nota) => selecionadas.includes(nota.id));
    const alternar = (id) => setSelecionadas((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

    const baixarLote = async (somenteSelecionadas) => {
        setBaixandoLote(true);
        try {
            const consulta = somenteSelecionadas ? { ids: selecionadas.join(',') } : params;
            const resposta = await fiscalApi.xmlEmLote(consulta);
            saveResponse(resposta, `Notas fiscais ${filtros.mes || filtros.ano || 'filtradas'}.zip`);
            const semXml = Number(resposta.headers['x-notas-sem-xml'] ?? 0);
            toast.success(`${resposta.headers['x-notas-incluidas'] ?? ''} XML(s) baixado(s)${semXml ? ` · ${semXml} nota(s) sem XML ficaram de fora` : ''}.`);
        } catch (erro) {
            let mensagem = errorMessage(erro, 'Não foi possível baixar os XMLs.');
            try {
                mensagem = JSON.parse(await erro.response.data.text()).message ?? mensagem;
            } catch {
                // mantém a mensagem
            }
            toast.error(mensagem);
        } finally {
            setBaixandoLote(false);
        }
    };

    const baixarXml = async (nota) => {
        try {
            saveResponse(await fiscalApi.xml(nota.id), `NFS-e ${nota.numero ?? nota.id.slice(0, 8)}.xml`);
        } catch (erro) {
            toast.error('Esta nota não possui XML.');
        }
    };

    const r = resumo.data;
    const serie = useMemo(() => (r?.serie ?? []).map((ponto) => ({ ...ponto, rotulo: mesCurto(ponto.mes) })), [r]);

    const colunas = [
        {
            key: 'sel',
            header: (
                <input
                    type="checkbox"
                    aria-label="Selecionar todas"
                    checked={todasMarcadas}
                    onChange={() => setSelecionadas(todasMarcadas ? [] : linhas.map((n) => n.id))}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            render: (n) => <input type="checkbox" checked={selecionadas.includes(n.id)} onChange={() => alternar(n.id)} onClick={(e) => e.stopPropagation()} aria-label="Selecionar nota" />,
        },
        {
            key: 'numero',
            header: 'Nota',
            render: (n) => (
                <div>
                    <strong>{n.numero ? `nº ${n.numero}` : 's/n'}</strong>
                    <div><Badge $tone={TIPOS_NOTA[n.tipo].tom === 'blue' ? 'info' : 'neutral'}>{TIPOS_NOTA[n.tipo].rotulo}</Badge></div>
                </div>
            ),
        },
        { key: 'emissao', header: 'Emissão', sortKey: 'dataEmissao', render: (n) => (n.dataEmissao ? formatDate(n.dataEmissao) : <Muted>—</Muted>) },
        {
            key: 'parte',
            header: 'Cliente / fornecedor',
            render: (n) => (
                <div>
                    <div>{n.cliente?.nome ?? n.fornecedor?.nome ?? n.parteNome ?? <Muted>—</Muted>}</div>
                    <Badge $tone={n.direcao === 'SAIDA' ? 'success' : 'warning'}>{n.direcao === 'SAIDA' ? 'Saída' : 'Entrada'}</Badge>
                </div>
            ),
        },
        {
            key: 'vinculos',
            header: 'Vínculos',
            render: (n) => (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {n.cliente && <Badge $tone="info">Cliente</Badge>}
                    {n.contrato && <Badge $tone="neutral">Contrato</Badge>}
                    {n.usina && <Badge $tone="neutral">Usina {n.usina.code}</Badge>}
                    {!n.cliente && !n.fornecedor && !n.contrato && !n.usina && <Badge $tone="warning">Sem vínculo</Badge>}
                </div>
            ),
        },
        { key: 'valor', header: 'Valor', sortKey: 'valorTotal', render: (n) => <strong>{formatCurrency(n.valorTotal)}</strong> },
        { key: 'impostos', header: 'Impostos', render: (n) => (n.valorImpostos > 0 ? formatCurrency(n.valorImpostos) : <Muted>—</Muted>) },
        { key: 'status', header: 'Situação', render: (n) => <Badge $tone={STATUS_NOTA[n.status].tom}>{STATUS_NOTA[n.status].rotulo}</Badge> },
        {
            key: 'contador',
            header: 'Contador',
            render: (n) => (n.enviadaContadorEm ? <Badge $tone="success"><FaCheckCircle /> Enviada</Badge> : <Muted>Pendente</Muted>),
        },
        {
            key: 'acoes',
            header: '',
            render: (n) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="sm" variant="ghost" title="Baixar XML" aria-label="Baixar XML" disabled={!n.temXml} onClick={(e) => { e.stopPropagation(); baixarXml(n); }}><FaFileCode /></Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        title="Espelho em PDF"
                        aria-label="Espelho em PDF"
                        onClick={(e) => {
                            e.stopPropagation();
                            openFileInTab(() => fiscalApi.espelho(n.id), 'nota.pdf', 'Gerando espelho…').catch((erro) => toast.error(errorMessage(erro)));
                        }}
                    >
                        <FaFilePdf />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaFileInvoiceDollar}
                tone="purple"
                title="Notas fiscais"
                subtitle={`Notas emitidas e recebidas, ligadas a clientes, contratos e usinas.${config.data?.proximoNumeroNfse > 1 ? ` Próxima NFS-e: nº ${config.data.proximoNumeroNfse}.` : ''}`}
                actions={
                    <>
                        <Button variant="secondary" icon={<FaCog />} onClick={() => navigate('/financeiro/fiscal/configuracao')}>Configuração fiscal</Button>
                        <Button variant="secondary" icon={<FaListUl />} onClick={() => navigate('/financeiro/fiscal/atividades')}>Atividades</Button>
                        <Button variant="secondary" icon={<FaCalendarCheck />} onClick={() => setDialogo('buscar')}>Buscar notas da prefeitura</Button>
                        <Button variant="secondary" icon={<FaFileImport />} onClick={() => setDialogo('importar')}>Importar XML</Button>
                        <Button variant="secondary" icon={<FaPlus />} onClick={() => setDialogo('nova')}>Cadastrar nota</Button>
                        <Button icon={<FaBolt />} onClick={() => setDialogo('emitir')}>Emitir nota</Button>
                    </>
                }
            />

            <StatGrid>
                <StatCard icon={FaReceipt} tom="purple" rotulo="Notas emitidas" valor={r?.mesAtual.emitidas ?? 0} detalhe={`no mês · ${r?.mesAtual.canceladas ?? 0} cancelada(s)`} delay={0} />
                <StatCard icon={FaFileInvoiceDollar} tom="green" rotulo="Faturado no mês" valor={r?.mesAtual.valorSaida ?? 0} formato={formatCurrency} detalhe={`${formatCurrency(r?.mesAtual.valorEntrada ?? 0)} em notas recebidas`} delay={60} />
                <StatCard icon={FaCalendarCheck} tom="orange" rotulo="Impostos nas notas" valor={r?.mesAtual.impostos ?? 0} formato={formatCurrency} detalhe={(r?.mesAtual.ibsCbs ?? 0) > 0 ? `ISS, ICMS, PIS e COFINS · IBS/CBS informativo: ${formatCurrency(r.mesAtual.ibsCbs)}` : 'ISS, ICMS, PIS e COFINS'} delay={120} />
                <StatCard icon={FaTimesCircle} tom={(r?.mesAtual.semXml ?? 0) > 0 ? 'red' : 'gray'} rotulo="Sem XML" valor={r?.mesAtual.semXml ?? 0} detalhe="notas sem arquivo guardado" delay={180} />
                <StatCard icon={FaPaperPlane} tom={(r?.mesAtual.naoEnviadas ?? 0) > 0 ? 'blue' : 'gray'} rotulo="A enviar ao contador" valor={r?.mesAtual.naoEnviadas ?? 0} detalhe="notas do mês ainda não enviadas" delay={240} />
            </StatGrid>

            <Card>
                <SectionTitle icon={FaFileInvoiceDollar} tom="purple">Faturamento nos últimos 12 meses</SectionTitle>
                <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="rotulo" />
                            <YAxis tickFormatter={eixoMil} />
                            <Tooltip {...tooltipTema} formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="saida" name="Notas emitidas" fill="#8E24AA" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="entrada" name="Notas recebidas" fill="#FB8C00" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="impostos" name="Impostos" stroke="#C62828" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <BarraDeFiltros>
                <div>
                    <SeletorPeriodo
                        modos={['mes', 'ano', 'tudo']}
                        de={filtros.mes ? inicioDoMes(`${filtros.mes}-01`) : filtros.ano ? inicioDoAno(`${filtros.ano}-01-01`) : ''}
                        ate={filtros.mes ? fimDoMes(`${filtros.mes}-01`) : filtros.ano ? fimDoAno(`${filtros.ano}-01-01`) : ''}
                        onChange={({ de, ate }) => {
                            const ehMes = de && de === inicioDoMes(de) && ate === fimDoMes(de);
                            setFiltros((atual) => ({ ...atual, mes: ehMes ? de.slice(0, 7) : '', ano: de && !ehMes ? de.slice(0, 4) : '' }));
                            setPage(1);
                            setSelecionadas([]);
                        }}
                    />
                </div>
                <FilterSelect label="Tipo" options={tipoOptions} value={filtros.tipo} onChange={alterar('tipo')} />
                <FilterSelect label="Sentido" options={direcaoOptions} value={filtros.direcao} onChange={alterar('direcao')} />
                <FilterSelect label="Situação" options={statusOptions} value={filtros.status} onChange={alterar('status')} />
                <FilterSelect
                    label="Vínculo"
                    value={filtros.semVinculo}
                    onChange={alterar('semVinculo')}
                    placeholder="Todos"
                    options={[{ value: 'true', label: 'Sem vínculo (a organizar)' }]}
                />
                <FilterSelect
                    label="Contador"
                    value={filtros.enviada}
                    onChange={alterar('enviada')}
                    placeholder="Todas"
                    options={[{ value: 'false', label: 'Não enviadas' }, { value: 'true', label: 'Já enviadas' }]}
                />
                <FilterInput label="Buscar por cliente ou fornecedor" placeholder="Nome, CPF/CNPJ, número ou chave…" value={filtros.search} onChange={alterar('search')} />
            </BarraDeFiltros>

            <Selecao as="div" style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}` }}>
                <span style={{ flex: 1 }}>
                    {selecionadas.length > 0 ? `${selecionadas.length} nota(s) selecionada(s)` : `${lista.data?.meta?.total ?? 0} nota(s) no filtro · ${formatCurrency(lista.data?.totais?.valor ?? 0)}`}
                    {sincronia.texto && (
                        <span style={{ marginLeft: 12, fontWeight: 500, fontSize: '0.85rem', color: sincronia.estado === 'erro' ? colors.danger : colors.muted }}>{sincronia.texto}</span>
                    )}
                </span>
                {(filtros.mes || filtros.ano) && (
                    <Button size="sm" variant="secondary" icon={<FaSyncAlt />} loading={sincronia.estado === 'buscando'} onClick={() => sincronizar(true)}>
                        Atualizar da prefeitura
                    </Button>
                )}
                {selecionadas.length > 0 && (
                    <Button size="sm" variant="secondary" icon={<FaFileCode />} loading={baixandoLote} onClick={() => baixarLote(true)}>XML das selecionadas</Button>
                )}
                <Button size="sm" variant="secondary" icon={<FaFileCode />} loading={baixandoLote} onClick={() => baixarLote(false)}>Baixar XML do filtro (.zip)</Button>
                <Button size="sm" icon={<FaPaperPlane />} onClick={() => navigate('/financeiro/contabilidade')}>Enviar ao contador</Button>
            </Selecao>

            {lista.error ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : (
                <>
                    <DataTable
                        columns={colunas}
                        rows={linhas}
                        loading={lista.isLoading}
                        onRowClick={(n) => setDetalheId(n.id)}
                        emptyTitle="Nenhuma nota encontrada"
                        emptyDescription="Emita uma NFS-e pelo sistema, importe um XML ou cadastre uma nota."
                    />
                    <PaginationBar meta={lista.data?.meta} onPageChange={(p) => { setPage(p); setSelecionadas([]); }} label="notas" />
                </>
            )}

            {detalheId && <NotaDialog id={detalheId} onClose={() => setDetalheId(null)} />}
            <NovaNotaDialog open={dialogo === 'nova'} onClose={() => setDialogo(null)} />
            <ImportarXmlDialog open={dialogo === 'importar'} onClose={() => setDialogo(null)} />
            <BuscarNotasDialog open={dialogo === 'buscar'} onClose={() => setDialogo(null)} />
            <EmitirNotaDialog open={dialogo === 'emitir'} onClose={() => setDialogo(null)} />
        </Page>
    );
}
