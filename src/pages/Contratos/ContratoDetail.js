import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaPrint, FaFileContract, FaFileInvoiceDollar, FaFilePdf, FaMoneyBillWave, FaReceipt, FaTrashAlt } from 'react-icons/fa';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { contratosApi, financeiroApi, fiscalApi, imprimirBoletos, openFileInTab } from '../../api/resources';
import { EmitirNotaDialog } from '../Financial/fiscal/EmitirNotaDialog';
import NotaDialog from '../Financial/fiscal/NotaDialog';
import { STATUS_NOTA } from '../Financial/fiscal/formato';
import GerarParcelasDialog from './GerarParcelasDialog';
import { errorMessage } from '../../api/client';
import DocumentosPanel from '../../components/DocumentosPanel';
import {
    Badge,
    Button,
    Card,
    CardTitle,
    ConfirmDialog,
    ErrorBlock,
    FilterSelect,
    Grid,
    KeyValue,
    LoadingBlock,
    Muted,
    Page,
    PageHeader,
    Row,
    Tabs,
    DetalheHero,
} from '../../ui';
import { statusContratoLabel, statusContratoOptions, statusContratoTone, TIPO_CONTRATO, tipoContratoLabel, tipoDocumentoOptions } from '../../utils/enums';
import { formatCurrency, formatDate, formatDocumento } from '../../utils/masks';

function EnderecoText({ endereco }) {
    if (!endereco) return null;
    const complemento = endereco.complemento ? ` - ${endereco.complemento}` : '';
    return `${endereco.logradouro}, ${endereco.numero}${complemento}, ${endereco.bairro}, ${endereco.cidade}/${endereco.uf} · CEP ${endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}`;
}

export default function ContratoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('contrato');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [downloading, setDownloading] = useState('');
    const [emitindoNfse, setEmitindoNfse] = useState(false);
    const [notaAberta, setNotaAberta] = useState(null);

    const { data: contrato, isLoading, error, refetch } = useQuery({
        queryKey: ['contrato', id],
        queryFn: () => contratosApi.get(id),
    });

    const refresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['contrato', id] });
        await queryClient.invalidateQueries({ queryKey: ['contratos'] });
    };

    // Parcelas deste contrato no financeiro (para o resumo do topo).
    const parcelas = useQuery({
        queryKey: ['financeiro', 'lancamentos', 'contrato', id],
        queryFn: () => financeiroApi.lancamentos({ contratoId: id, situacao: '', pageSize: 100 }),
    });

    // Notas fiscais emitidas ou vinculadas a este contrato.
    const notas = useQuery({
        queryKey: ['fiscal', 'notas', 'contrato', id],
        queryFn: () => fiscalApi.notas({ contratoId: id, pageSize: 50 }),
    });

    const changeStatus = useMutation({
        mutationFn: (status) => contratosApi.updateStatus(id, status),
        onSuccess: async () => { await refresh(); toast.success('Situação atualizada.'); },
        onError: (err) => toast.error(errorMessage(err)),
    });

    // Cria no financeiro as parcelas a receber do contrato (uma por vencimento), com boletos se pedido.
    const [parcelasDialog, setParcelasDialog] = useState(null); // null | { refazer: boolean, motivo?: string }
    const [imprimindo, setImprimindo] = useState(false);

    const remove = useMutation({
        mutationFn: () => contratosApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['contratos'] });
            toast.success('Contrato excluído.');
            navigate('/contratos');
        },
        onError: (err) => {
            setConfirmDelete(false);
            toast.error(errorMessage(err));
        },
    });

    const downloadPdf = async (kind) => {
        setDownloading(kind);
        try {
            await openFileInTab(
                () => (kind === 'contrato' ? contratosApi.pdf(id) : contratosApi.promissoriaPdf(id)),
                kind === 'contrato' ? 'contrato.pdf' : 'promissoria.pdf',
                kind === 'contrato' ? 'Gerando contrato…' : 'Gerando nota promissória…',
            );
        } catch (err) {
            // Respostas de erro vêm como blob (responseType: blob); converte para ler a mensagem.
            let message = errorMessage(err);
            try {
                const text = await err.response?.data?.text?.();
                if (text) message = JSON.parse(text).message ?? message;
            } catch {
                // mantém a mensagem padrão
            }
            toast.error(message);
        } finally {
            setDownloading('');
        }
    };

    if (isLoading) return <Page><LoadingBlock /></Page>;
    if (error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    const { cliente, avalista, promissoria } = contrato;
    const parcelasLista = parcelas.data?.data ?? [];
    const recebido = parcelasLista.reduce((acc, item) => acc + (item.valorPago ?? 0), 0);
    const totalParcelas = parcelasLista.reduce((acc, item) => acc + (item.valor ?? 0), 0);
    const boletosParaImprimir = parcelasLista
        .filter((item) => item.boleto && ['ABERTO', 'PARCIAL'].includes(item.status) && !/^(BAIXADO|REJEITADO|LIQUIDADO)/i.test(item.boleto.situacao ?? ''))
        .sort((a, b) => String(a.dataVencimento).localeCompare(String(b.dataVencimento)));

    // Junta os PDFs dos boletos em aberto (um por página) para impressão e entrega física.
    const imprimirDoContrato = async () => {
        setImprimindo(true);
        try {
            const falhas = await imprimirBoletos(boletosParaImprimir.map((item) => item.id));
            if (falhas.length > 0) toast(`${falhas.length} boleto(s) ficaram de fora: ${falhas[0].motivo}`, { duration: 7000 });
        } catch (err) {
            toast.error(errorMessage(err, 'Não foi possível reunir os boletos.'));
        } finally {
            setImprimindo(false);
        }
    };

    // Pré-preenchimento da NFS-e: valor total ou uma parcela, com a descrição do que foi contratado.
    const descricaoNfse = (() => {
        if (contrato.tipo === TIPO_CONTRATO.SERVICO_GERAL) return contrato.objeto ?? '';
        const sistema = `${contrato.quantModulos ? `${contrato.quantModulos} módulos ` : ''}${contrato.modeloModulos}, ${contrato.potModulos} kWp`;
        const base = contrato.tipo === TIPO_CONTRATO.COMPRA_VENDA ? 'Fornecimento e instalação' : 'Prestação de serviços de instalação';
        return `${base} de sistema fotovoltaico (${sistema}) conforme contrato de ${formatDate(contrato.dataContrato)}.`;
    })();
    const presetNfse = {
        clienteId: cliente.id,
        contratoId: id,
        usinaId: contrato.plants?.[0]?.id,
        valorServicos: contrato.priceTotal,
        discriminacao: descricaoNfse,
        opcoes: [
            { id: 'total', rotulo: `Valor total do contrato · ${formatCurrency(contrato.priceTotal)}`, valor: contrato.priceTotal },
            ...parcelasLista
                .filter((item) => item.status !== 'CANCELADO')
                .sort((a, b) => String(a.dataVencimento).localeCompare(String(b.dataVencimento)))
                .map((item) => ({
                    id: item.id,
                    lancamentoId: item.id,
                    valor: item.valor,
                    rotulo: `${item.descricao} · venc. ${formatDate(item.dataVencimento)} · ${formatCurrency(item.valor)}`,
                })),
        ],
    };
    const notasLista = notas.data?.data ?? [];

    const proxima = parcelasLista.filter((item) => ['ABERTO', 'PARCIAL'].includes(item.status)).sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];
    const geral = contrato.tipo === TIPO_CONTRATO.SERVICO_GERAL;
    const servicos = contrato.tipo !== TIPO_CONTRATO.COMPRA_VENDA;
    const avista = servicos && contrato.quantParcelas <= 1;

    return (
        <Page>
            <PageHeader
                icon={FaFileContract}
                tone="purple"
                title="Contrato"
                subtitle={`${tipoContratoLabel(contrato.tipo)} firmado em ${formatDate(contrato.dataContrato)}`}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => navigate('/contratos')}>Voltar</Button>
                        <Button variant="secondary" icon={<FaFilePdf />} loading={downloading === 'contrato'} onClick={() => downloadPdf('contrato')}>Contrato</Button>
                        {!servicos && (
                            <Button variant="secondary" icon={<FaReceipt />} loading={downloading === 'promissoria'} onClick={() => downloadPdf('promissoria')}>Promissória</Button>
                        )}
                        <Button variant="secondary" icon={<FaMoneyBillWave />} onClick={() => setParcelasDialog({ refazer: false })}>Gerar parcelas</Button>
                        <Button variant="secondary" icon={<FaFileInvoiceDollar />} onClick={() => setEmitindoNfse(true)}>Emitir NFS-e</Button>
                        {boletosParaImprimir.length > 0 && (
                            <Button variant="secondary" icon={<FaPrint />} loading={imprimindo} onClick={imprimirDoContrato}>
                                Imprimir boletos ({boletosParaImprimir.length})
                            </Button>
                        )}
                        <Button variant="secondary" icon={<FaEdit />} onClick={() => navigate(`/contratos/${id}/editar`)}>Editar</Button>
                        <Button variant="danger" icon={<FaTrashAlt />} onClick={() => setConfirmDelete(true)}>Excluir</Button>
                    </>
                }
            />

            <DetalheHero
                nome={cliente.nome}
                tom="purple"
                icon={FaFileInvoiceDollar}
                chips={
                    <>
                        <Badge $tone={statusContratoTone[contrato.status]}>{statusContratoLabel(contrato.status)}</Badge>
                        <Badge $tone="info">{tipoContratoLabel(contrato.tipo)}</Badge>
                        <Badge>{avista ? 'À vista' : `${contrato.quantParcelas}x de ${formatCurrency(contrato.priceParcela)}`}</Badge>
                    </>
                }
                indicadores={[
                    { rotulo: 'Valor do contrato', valor: formatCurrency(contrato.priceTotal) },
                    { rotulo: 'Recebido', valor: formatCurrency(recebido), cor: 'var(--c-success)' },
                    { rotulo: 'Parcelas pagas', valor: totalParcelas > 0 ? `${Math.round((recebido / totalParcelas) * 100)}%` : '—' },
                    { rotulo: 'Próximo vencimento', valor: proxima ? formatDate(proxima.dataVencimento) : '—' },
                ]}
            />

            <Tabs
                tabs={[
                    { id: 'contrato', label: 'Contrato', icon: <FaFileContract /> },
                    { id: 'documentos', label: `Documentos (${contrato._count.documentos})`, icon: <FaFilePdf /> },
                ]}
                value={tab}
                onChange={setTab}
            />

            {tab === 'contrato' && (
                <>
                    <Card>
                        <Row $justify="space-between">
                            <CardTitle>Situação</CardTitle>
                            <Badge $tone={statusContratoTone[contrato.status]}>{statusContratoLabel(contrato.status)}</Badge>
                        </Row>
                        <Row $gap={12}>
                            <div style={{ minWidth: 220 }}>
                                <FilterSelect
                                    label="Alterar situação"
                                    options={statusContratoOptions}
                                    value={contrato.status}
                                    placeholder="Selecione"
                                    disabled={changeStatus.isPending}
                                    onChange={(event) => event.target.value && changeStatus.mutate(event.target.value)}
                                />
                            </div>
                        </Row>
                    </Card>

                    <Card>
                        <CardTitle>Contratante</CardTitle>
                        <Grid $cols={3}>
                            <KeyValue label="Cliente"><Link to={`/clientes/${cliente.id}`}>{cliente.nome}</Link></KeyValue>
                            <KeyValue label="Documento">{cliente.documento && formatDocumento(cliente.documento)}</KeyValue>
                            <KeyValue label="Tipo">{cliente.tipoPessoa === 'PESSOA_JURIDICA' ? 'Pessoa jurídica' : 'Pessoa física'}</KeyValue>
                        </Grid>
                    </Card>

                    <Card>
                        <CardTitle>Condições financeiras</CardTitle>
                        <Grid $cols={3}>
                            <KeyValue label="Valor total">{formatCurrency(contrato.priceTotal)}</KeyValue>
                            <KeyValue label="Pagamento">
                                {avista ? 'À vista, na assinatura' : `${contrato.quantParcelas}x de ${formatCurrency(contrato.priceParcela)}`}
                            </KeyValue>
                            {!servicos && <KeyValue label="Carência">{`${contrato.carencia ?? 0} dias`}</KeyValue>}
                            <KeyValue label="Data do contrato">{formatDate(contrato.dataContrato)}</KeyValue>
                            {!avista && <KeyValue label="1ª parcela">{formatDate(contrato.dataPrimeiraParcela)}</KeyValue>}
                            {!servicos && <KeyValue label="Nota promissória">{promissoria ? `Nº ${promissoria.numero}/${promissoria.ano}` : ''}</KeyValue>}
                        </Grid>
                    </Card>

                    {geral && (
                        <Card>
                            <CardTitle>Serviço contratado</CardTitle>
                            <Grid $cols={2}>
                                <KeyValue label="Objeto">{contrato.objeto}</KeyValue>
                                <KeyValue label="Prazo de execução">{contrato.prazoExecucao}</KeyValue>
                                <KeyValue label="Local de execução"><EnderecoText endereco={contrato.endereco} /></KeyValue>
                            </Grid>
                            <p style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{contrato.escopo}</p>
                            {contrato.garantia && <p style={{ marginTop: 8, whiteSpace: 'pre-line' }}><strong>Garantia:</strong> {contrato.garantia}</p>}
                            {contrato.clausulasAdicionais && <p style={{ marginTop: 8, whiteSpace: 'pre-line' }}><strong>Condições adicionais:</strong> {contrato.clausulasAdicionais}</p>}
                        </Card>
                    )}

                    {!geral && <Card>
                        <CardTitle>Sistema fotovoltaico</CardTitle>
                        <Grid $cols={2}>
                            <KeyValue label="Módulos">{`${contrato.modeloModulos} · ${contrato.potModulos} kWp`}</KeyValue>
                            <KeyValue label="Inversor">{`${contrato.modeloInversor} · ${contrato.potInversor} kW`}</KeyValue>
                            {servicos && <KeyValue label="Quantidade de módulos">{String(contrato.quantModulos ?? '')}</KeyValue>}
                            {servicos && (
                                <KeyValue label="Estimativa de geração">
                                    {contrato.estimativaGeracaoMensal != null ? `${Number(contrato.estimativaGeracaoMensal).toLocaleString('pt-BR')} kWh/mês` : ''}
                                </KeyValue>
                            )}
                            <KeyValue label="Local da instalação"><EnderecoText endereco={contrato.endereco} /></KeyValue>
                        </Grid>
                        {contrato.plants?.length > 0 && (
                            <p style={{ marginTop: 12 }}>
                                Usinas: {contrato.plants.map((plant, index) => (
                                    <span key={plant.id}>{index > 0 && ', '}<Link to={`/usinas/${plant.id}`}>{plant.code}</Link></span>
                                ))}
                            </p>
                        )}
                    </Card>}

                    <Card>
                        <Row $justify="space-between">
                            <CardTitle>Notas fiscais</CardTitle>
                            <Button size="sm" variant="secondary" icon={<FaFileInvoiceDollar />} onClick={() => setEmitindoNfse(true)}>Emitir NFS-e</Button>
                        </Row>
                        {notasLista.length === 0 ? (
                            <Muted>Nenhuma nota fiscal vinculada a este contrato.</Muted>
                        ) : (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {notasLista.map((n) => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => setNotaAberta(n.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 10, background: 'transparent', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        <Badge $tone={STATUS_NOTA[n.status]?.tom ?? 'neutral'}>{STATUS_NOTA[n.status]?.rotulo ?? n.status}</Badge>
                                        <strong style={{ flex: 1 }}>{`NFS-e nº ${n.numero ?? 's/n'}`}</strong>
                                        <Muted>{n.dataEmissao ? formatDate(n.dataEmissao) : ''}</Muted>
                                        <strong>{formatCurrency(n.valorTotal)}</strong>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {!servicos && <Card>
                        <CardTitle>Avalista</CardTitle>
                        {avalista ? (
                            <Grid $cols={2}>
                                <KeyValue label="Nome">{avalista.nome}</KeyValue>
                                <KeyValue label="CPF">{formatDocumento(avalista.cpf)}</KeyValue>
                                <KeyValue label="Profissão">{avalista.profissao}</KeyValue>
                                <KeyValue label="Endereço"><EnderecoText endereco={avalista.endereco} /></KeyValue>
                            </Grid>
                        ) : (
                            <Muted>Sem avalista.</Muted>
                        )}
                    </Card>}
                </>
            )}

            {tab === 'documentos' && (
                <DocumentosPanel
                    contractId={id}
                    tipos={tipoDocumentoOptions}
                    defaultTipo="CONTRATO_ASSINADO"
                />
            )}

            <EmitirNotaDialog
                open={emitindoNfse}
                preset={presetNfse}
                onClose={() => {
                    setEmitindoNfse(false);
                    notas.refetch();
                }}
            />
            {notaAberta && <NotaDialog id={notaAberta} onClose={() => { setNotaAberta(null); notas.refetch(); }} />}

            {parcelasDialog && (
                <GerarParcelasDialog
                    contrato={contrato}
                    refazer={parcelasDialog.refazer}
                    motivo={parcelasDialog.motivo}
                    onClose={() => setParcelasDialog(null)}
                    onConflito={(motivo) => setParcelasDialog({ refazer: true, motivo })}
                />
            )}

            <ConfirmDialog
                open={confirmDelete}
                title="Excluir contrato"
                message="Excluir este contrato, a nota promissória e os documentos anexados? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                danger
                loading={remove.isPending}
                onConfirm={() => remove.mutate()}
                onClose={() => setConfirmDelete(false)}
            />
        </Page>
    );
}
