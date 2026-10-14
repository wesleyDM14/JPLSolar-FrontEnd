import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBan, FaEdit, FaEraser, FaFilePdf, FaFileCode, FaLink, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { errorMessage } from '../../../api/client';
import { clientesApi, contratosApi, fiscalApi, openFileInTab, saveBlob, usinasApi } from '../../../api/resources';
import { Badge, Button, Combobox, ConfirmDialog, Dialog, ErrorBlock, FilterSelect, Grid, KeyValue, LoadingBlock, Muted, Row, SectionTitle, Textarea, tokens } from '../../../ui';
import { formatCurrency, formatDate, formatDocumento } from '../../../utils/masks';
import SubstituirNotaDialog from './SubstituirNotaDialog';
import { STATUS_NOTA, TIPOS_NOTA, statusOptions } from './formato';

const { colors } = tokens;

/** Detalhe da nota: dados, valores, XML, espelho em PDF e vínculos com cliente, contrato e usina. */
export default function NotaDialog({ id, onClose }) {
    const queryClient = useQueryClient();
    const [excluir, setExcluir] = useState(false);
    const [cancelar, setCancelar] = useState(false);
    const [substituir, setSubstituir] = useState(false);
    const [inutilizar, setInutilizar] = useState(false);
    const [motivoInutilizacao, setMotivoInutilizacao] = useState('');
    const [codigoCancelamento, setCodigoCancelamento] = useState('1');

    const { data: nota, isLoading, error, refetch } = useQuery({ queryKey: ['fiscal', 'nota', id], queryFn: () => fiscalApi.nota(id), enabled: Boolean(id) });

    const contratos = useQuery({
        queryKey: ['contratos', 'para-nota', nota?.cliente?.id],
        queryFn: () => contratosApi.list({ clienteId: nota.cliente.id, pageSize: 50 }),
        enabled: Boolean(nota?.cliente?.id),
    });
    const usinas = useQuery({
        queryKey: ['usinas', 'para-nota', nota?.cliente?.id],
        queryFn: () => usinasApi.list({ clientId: nota.cliente.id, pageSize: 50 }),
        enabled: Boolean(nota?.cliente?.id),
    });

    const atualizar = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fiscal'] }),
        queryClient.invalidateQueries({ queryKey: ['financeiro', 'cliente-visao'] }),
    ]);

    const salvar = useMutation({
        mutationFn: (payload) => fiscalApi.atualizarNota(id, payload),
        onSuccess: async () => {
            await atualizar();
            toast.success('Nota atualizada.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const remover = useMutation({
        mutationFn: () => fiscalApi.excluirNota(id),
        onSuccess: async () => {
            await atualizar();
            toast.success('Nota excluída.');
            onClose();
        },
        onError: (erro) => {
            setExcluir(false);
            toast.error(errorMessage(erro));
        },
    });

    const consultar = useMutation({
        mutationFn: () => fiscalApi.consultarNfse(id),
        onSuccess: async (resultado) => {
            await atualizar();
            if (resultado.encontrada) toast.success(`Nota encontrada na prefeitura (nº ${resultado.numero}).`);
            else toast.error(resultado.mensagens?.[0]?.mensagem ?? 'A prefeitura não encontrou esta nota.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const cancelamento = useMutation({
        mutationFn: () => fiscalApi.cancelarNfse(id, Number(codigoCancelamento)),
        onSuccess: async () => {
            await atualizar();
            setCancelar(false);
            toast.success('Nota cancelada na prefeitura.');
        },
        onError: (erro) => {
            setCancelar(false);
            toast.error(errorMessage(erro));
        },
    });

    const inutilizacao = useMutation({
        mutationFn: () => fiscalApi.inutilizarNfse(id, motivoInutilizacao.trim()),
        onSuccess: async () => {
            await atualizar();
            setInutilizar(false);
            setMotivoInutilizacao('');
            toast.success('Número inutilizado.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    if (!id) return null;

    const baixarXml = async () => {
        try {
            const resposta = await fiscalApi.xml(id);
            saveBlob(resposta.data, `nota-${nota.numero ?? id.slice(0, 8)}.xml`);
        } catch (erro) {
            // Erros de download chegam como blob: lê a mensagem para exibir algo útil.
            let mensagem = errorMessage(erro, 'Não foi possível baixar o XML.');
            try {
                mensagem = JSON.parse(await erro.response.data.text()).message ?? mensagem;
            } catch {
                // mantém a mensagem padrão
            }
            toast.error(mensagem);
        }
    };

    const verEspelho = () => openFileInTab(() => fiscalApi.espelho(id), 'nota.pdf', 'Gerando espelho da nota…').catch((erro) => toast.error(errorMessage(erro)));

    const emitidaPeloSistema = Boolean(nota && nota.tipo === 'NFSE' && nota.origem === 'EMITIDA');
    const tipo = nota ? TIPOS_NOTA[nota.tipo] : null;
    const situacao = nota ? STATUS_NOTA[nota.status] : null;

    const buscarClientes = async (termo) => (await clientesApi.options(termo)).map((c) => ({ value: c.id, label: c.nome, hint: c.documento ? formatDocumento(c.documento) : undefined }));

    return (
        <>
            <Dialog
                open
                width={820}
                onClose={onClose}
                title={nota ? `${tipo.rotulo} nº ${nota.numero ?? 's/n'}` : 'Nota fiscal'}
                subtitle={nota ? `${nota.direcao === 'SAIDA' ? 'Nota emitida' : 'Nota recebida'} · ${nota.dataEmissao ? formatDate(nota.dataEmissao) : 'sem data de emissão'}` : undefined}
                footer={
                    nota && (
                        <>
                            {nota.status !== 'AUTORIZADA' && (
                                <Button variant="danger" icon={<FaTrash />} onClick={() => setExcluir(true)} style={{ marginRight: 'auto' }}>Excluir</Button>
                            )}
                            {emitidaPeloSistema && nota.status === 'AUTORIZADA' && (
                                <>
                                    <Button variant="danger" icon={<FaBan />} onClick={() => setCancelar(true)} style={{ marginRight: 'auto' }}>Cancelar nota</Button>
                                    <Button variant="secondary" icon={<FaEdit />} onClick={() => setSubstituir(true)}>Corrigir (substituir)</Button>
                                </>
                            )}
                            {emitidaPeloSistema && ['PENDENTE', 'REJEITADA'].includes(nota.status) && (
                                <Button variant="secondary" icon={<FaEraser />} onClick={() => setInutilizar(true)}>Inutilizar número</Button>
                            )}
                            {emitidaPeloSistema && ['PENDENTE', 'AUTORIZADA'].includes(nota.status) && (
                                <Button variant="secondary" icon={<FaSyncAlt />} loading={consultar.isPending} onClick={() => consultar.mutate()}>Consultar na prefeitura</Button>
                            )}
                            <Button variant="secondary" icon={<FaFilePdf />} onClick={verEspelho}>Espelho (PDF)</Button>
                            <Button variant="secondary" icon={<FaFileCode />} disabled={!nota.temXml} onClick={baixarXml}>Baixar XML</Button>
                        </>
                    )
                }
            >
                {isLoading && <LoadingBlock />}
                {error && <ErrorBlock message={errorMessage(error)} onRetry={refetch} />}

                {nota && (
                    <div style={{ display: 'grid', gap: 18 }}>
                        <Row>
                            <Badge $tone={tipo.tom === 'blue' ? 'info' : 'neutral'}>{tipo.completo}</Badge>
                            <Badge $tone={situacao.tom}>{situacao.rotulo}</Badge>
                            <Badge $tone={nota.direcao === 'SAIDA' ? 'success' : 'warning'}>{nota.direcao === 'SAIDA' ? 'Saída' : 'Entrada'}</Badge>
                            {nota.enviadaContadorEm ? <Badge $tone="info">Enviada ao contador em {formatDate(nota.enviadaContadorEm)}</Badge> : <Muted>Ainda não enviada ao contador</Muted>}
                        </Row>

                        <Grid $cols={3}>
                            <KeyValue label="Número / série">{[nota.numero, nota.serie].filter(Boolean).join(' / ')}</KeyValue>
                            <KeyValue label={nota.direcao === 'SAIDA' ? 'Tomador' : 'Emitente'}>{nota.parteNome ?? nota.cliente?.nome ?? nota.fornecedor?.nome}</KeyValue>
                            <KeyValue label="CPF/CNPJ">{nota.parteDocumento ? formatDocumento(nota.parteDocumento) : ''}</KeyValue>
                            <KeyValue label="Natureza da operação">{nota.naturezaOperacao}</KeyValue>
                            <KeyValue label="Chave de acesso / verificação"><span style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>{nota.chaveAcesso ?? nota.protocolo}</span></KeyValue>
                            {nota.rpsNumero !== null && nota.rpsNumero !== undefined && <KeyValue label="RPS (número / série)">{`${nota.rpsNumero} / ${nota.rpsSerie ?? ''}`}</KeyValue>}
                            {nota.codigoVerificacao && <KeyValue label="Código de verificação">{nota.codigoVerificacao}</KeyValue>}
                            {nota.canceladaEm && <KeyValue label="Cancelada em">{formatDate(nota.canceladaEm)}</KeyValue>}
                            {nota.atividade && <KeyValue label="Atividade">{`${nota.atividade.itemListaServico} · ${nota.atividade.descricao}`}</KeyValue>}
                            {nota.substituiNota && (
                                <KeyValue label="Substitui a nota">{`nº ${nota.substituiNota.numero ?? 's/n'}`}</KeyValue>
                            )}
                            {nota.substituidaPor?.length > 0 && (
                                <KeyValue label="Substituída pela nota">{nota.substituidaPor.map((n) => `nº ${n.numero ?? 's/n'}`).join(', ')}</KeyValue>
                            )}
                            {nota.inutilizadaEm && <KeyValue label="Inutilizada em">{formatDate(nota.inutilizadaEm)}</KeyValue>}
                            <KeyValue label="Origem">{{ MANUAL: 'Cadastro manual', IMPORTADA: 'XML importado', EMITIDA: 'Emitida pelo sistema' }[nota.origem]}</KeyValue>
                        </Grid>

                        {nota.motivoInutilizacao && (
                            <div style={{ padding: 12, borderRadius: 10, background: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
                                <Muted style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo da inutilização</Muted>
                                <div>{nota.motivoInutilizacao}</div>
                            </div>
                        )}

                        {nota.mensagens?.length > 0 && (
                            <div style={{ padding: 12, borderRadius: 10, background: colors.warningBg, display: 'grid', gap: 6 }}>
                                <strong>Retorno da prefeitura</strong>
                                {nota.mensagens.map((m, i) => (
                                    <div key={`${m.codigo}-${i}`}>
                                        <Badge $tone={m.alerta ? 'warning' : 'danger'}>{m.codigo}</Badge> {m.mensagem}
                                        {m.correcao && <Muted> — {m.correcao}</Muted>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {nota.descricao && (
                            <div style={{ padding: 12, borderRadius: 10, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, lineHeight: 1.5 }}>
                                <Muted style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discriminação</Muted>
                                <div>{nota.descricao}</div>
                            </div>
                        )}

                        <div>
                            <SectionTitle>Valores</SectionTitle>
                            <Grid $cols={4}>
                                <KeyValue label="Serviços">{formatCurrency(nota.valorServicos)}</KeyValue>
                                <KeyValue label="Produtos">{formatCurrency(nota.valorProdutos)}</KeyValue>
                                <KeyValue label="Desconto">{formatCurrency(nota.valorDesconto)}</KeyValue>
                                <KeyValue label="Total"><strong style={{ fontSize: '1.1rem' }}>{formatCurrency(nota.valorTotal)}</strong></KeyValue>
                                <KeyValue label="ISS">{formatCurrency(nota.valorIss)}</KeyValue>
                                <KeyValue label="ICMS">{formatCurrency(nota.valorIcms)}</KeyValue>
                                <KeyValue label="PIS">{formatCurrency(nota.valorPis)}</KeyValue>
                                <KeyValue label="COFINS">{formatCurrency(nota.valorCofins)}</KeyValue>
                                {nota.ibsCbs && (
                                    <>
                                        <KeyValue label="IBS">{formatCurrency(nota.ibsCbs.valorIbs ?? 0)}</KeyValue>
                                        <KeyValue label="CBS">{formatCurrency(nota.ibsCbs.valorCbs ?? 0)}</KeyValue>
                                        <KeyValue label="Alíquotas IBS / CBS">{`${nota.ibsCbs.aliquotaIbs ?? '—'}% / ${nota.ibsCbs.aliquotaCbs ?? '—'}%`}</KeyValue>
                                        <KeyValue label="Classificação IBS/CBS">
                                            {nota.classificacaoTributaria ? `${nota.classificacaoTributaria} · CST ${nota.ibsCbs.cst ?? ''}` : ''}
                                        </KeyValue>
                                    </>
                                )}
                            </Grid>
                        </div>

                        <div>
                            <SectionTitle icon={FaLink} tom="blue">Vínculos</SectionTitle>
                            <Grid $cols={3}>
                                <Combobox
                                    label="Cliente"
                                    queryKey="clientes-nota"
                                    placeholder="Vincular a um cliente"
                                    fetcher={buscarClientes}
                                    selected={nota.cliente ? { value: nota.cliente.id, label: nota.cliente.nome } : null}
                                    onChange={(valor) => salvar.mutate({ clienteId: valor || null, contratoId: null, usinaId: null })}
                                />
                                <FilterSelect
                                    label="Contrato"
                                    placeholder={nota.cliente ? 'Sem contrato' : 'Escolha o cliente primeiro'}
                                    disabled={!nota.cliente}
                                    value={nota.contrato?.id ?? ''}
                                    onChange={(e) => salvar.mutate({ contratoId: e.target.value || null })}
                                    options={(contratos.data?.data ?? []).map((c) => ({ value: c.id, label: `${formatDate(c.dataContrato)} · ${formatCurrency(c.priceTotal)}` }))}
                                />
                                <FilterSelect
                                    label="Usina"
                                    placeholder={nota.cliente ? 'Sem usina' : 'Escolha o cliente primeiro'}
                                    disabled={!nota.cliente}
                                    value={nota.usina?.id ?? ''}
                                    onChange={(e) => salvar.mutate({ usinaId: e.target.value || null })}
                                    options={(usinas.data?.data ?? []).map((u) => ({ value: u.id, label: u.code }))}
                                />
                            </Grid>
                            <div style={{ marginTop: 14, maxWidth: 260 }}>
                                <FilterSelect
                                    label="Situação da nota"
                                    placeholder={null}
                                    value={nota.status}
                                    disabled={emitidaPeloSistema || nota.status === 'INUTILIZADA'}
                                    onChange={(e) => salvar.mutate({ status: e.target.value })}
                                    options={statusOptions.filter((o) => o.value !== 'INUTILIZADA')}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog
                open={cancelar}
                width={480}
                title="Cancelar NFS-e"
                subtitle="O cancelamento é enviado à prefeitura e não pode ser desfeito."
                onClose={() => setCancelar(false)}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCancelar(false)}>Voltar</Button>
                        <Button variant="danger" icon={<FaBan />} loading={cancelamento.isPending} onClick={() => cancelamento.mutate()}>Cancelar nota</Button>
                    </>
                }
            >
                <FilterSelect
                    label="Motivo"
                    placeholder={null}
                    value={codigoCancelamento}
                    onChange={(e) => setCodigoCancelamento(e.target.value)}
                    options={[
                        { value: '1', label: '1 — Erro na emissão' },
                        { value: '2', label: '2 — Serviço não prestado' },
                        { value: '4', label: '4 — Duplicidade da nota' },
                    ]}
                />
                <p style={{ margin: '12px 0 0' }}>
                    <Muted>A prefeitura aceita o cancelamento automaticamente até o dia 5 do mês seguinte; depois disso é preciso pedir pelo portal.</Muted>
                </p>
            </Dialog>

            {substituir && nota && (
                <SubstituirNotaDialog
                    nota={nota}
                    onClose={(novaId) => {
                        setSubstituir(false);
                        if (novaId) onClose();
                    }}
                />
            )}

            <Dialog
                open={inutilizar}
                width={500}
                title="Inutilizar número"
                subtitle={nota ? `RPS ${nota.rpsNumero} / ${nota.rpsSerie ?? ''}` : undefined}
                onClose={() => setInutilizar(false)}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setInutilizar(false)}>Voltar</Button>
                        <Button
                            variant="danger"
                            icon={<FaEraser />}
                            loading={inutilizacao.isPending}
                            disabled={motivoInutilizacao.trim().length < 15}
                            onClick={() => inutilizacao.mutate()}
                        >
                            Inutilizar
                        </Button>
                    </>
                }
            >
                <p style={{ margin: '0 0 10px' }}>
                    <Muted>
                        O número deste RPS não será reaproveitado. Antes de baixar, o sistema confere na prefeitura se a nota realmente
                        não foi gerada.
                    </Muted>
                </p>
                <Textarea
                    rows={3}
                    placeholder="Motivo (mínimo de 15 caracteres)"
                    value={motivoInutilizacao}
                    onChange={(e) => setMotivoInutilizacao(e.target.value)}
                />
            </Dialog>

            <ConfirmDialog
                open={excluir}
                title="Excluir nota"
                message="Excluir esta nota do sistema? O XML guardado também será removido."
                confirmLabel="Excluir"
                danger
                loading={remover.isPending}
                onConfirm={() => remover.mutate()}
                onClose={() => setExcluir(false)}
            />
        </>
    );
}
