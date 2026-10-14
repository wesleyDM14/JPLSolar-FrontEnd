import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ClienteDialog from './ClienteDialog';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Button, ConfirmDialog, DataTable, Dialog, ErrorBlock, Grid, KeyValue, LoadingBlock, Muted, Row } from '../../ui';
import { formatDate } from '../../utils/masks';
import BaixaDialog from './BaixaDialog';
import { brl, formaLabel, parteDe, situacaoInfo, TIPO } from './format';
import BoletoSecao from './boleto/BoletoSecao';
import LancamentoFormDialog from './LancamentoFormDialog';

/** Detalhe do lançamento: situação, baixas, boleto e ações (baixar, editar, cancelar, excluir). */
export default function LancamentoDialog({ id, onClose }) {
    const queryClient = useQueryClient();
    const [baixa, setBaixa] = useState(false);
    const [edicao, setEdicao] = useState(false);
    const [clienteAberto, setClienteAberto] = useState(false);
    const [confirmacao, setConfirmacao] = useState(null); // 'cancelar' | 'excluir' | { estornar: pagamento }

    const { data: lancamento, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'lancamento', id],
        queryFn: () => financeiroApi.lancamento(id),
        enabled: Boolean(id),
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['financeiro'] });

    const acao = useMutation({
        mutationFn: async (tipo) => {
            if (tipo === 'cancelar') return financeiroApi.cancelarLancamento(id);
            if (tipo === 'reabrir') return financeiroApi.reabrirLancamento(id);
            if (tipo === 'excluir') return financeiroApi.removeLancamento(id);
            if (tipo?.estornar) return financeiroApi.estornar(tipo.estornar.id);
            return null;
        },
        onSuccess: async (_resultado, tipo) => {
            await refresh();
            setConfirmacao(null);
            if (tipo === 'excluir') {
                toast.success('Lançamento excluído.');
                onClose();
            } else {
                toast.success('Atualizado.');
            }
        },
        onError: (err) => {
            setConfirmacao(null);
            toast.error(errorMessage(err));
        },
    });

    if (!id) return null;

    const receber = lancamento?.tipo === TIPO.RECEBER;
    const situacao = lancamento ? situacaoInfo(lancamento.situacao, lancamento.tipo) : null;
    const emAberto = lancamento && ['ABERTO', 'PARCIAL'].includes(lancamento.status);
    const cancelado = lancamento?.status === 'CANCELADO';
    const ativos = (lancamento?.pagamentos ?? []).filter((pagamento) => !pagamento.estornadoEm);

    return (
        <>
            <Dialog
                open
                width={760}
                onClose={onClose}
                title={lancamento ? lancamento.descricao : 'Lançamento'}
                footer={<Button variant="secondary" onClick={onClose}>Fechar</Button>}
            >
                {isLoading && <LoadingBlock />}
                {error && <ErrorBlock message={errorMessage(error)} onRetry={refetch} />}

                {lancamento && (
                    <>
                        <Row $justify="space-between" style={{ marginBottom: 14 }}>
                            <Row>
                                <Badge $tone={situacao.tone}>{situacao.label}</Badge>
                                {lancamento.situacao === 'ATRASADO' && <Muted>{lancamento.diasAtraso} dia(s) de atraso</Muted>}
                                {lancamento.parcelaTotal && <Muted>parcela {lancamento.parcelaNumero}/{lancamento.parcelaTotal}</Muted>}
                            </Row>
                            <Row>
                                {emAberto && <Button size="sm" onClick={() => setBaixa(true)}>{receber ? 'Registrar recebimento' : 'Registrar pagamento'}</Button>}
                                {!cancelado && <Button size="sm" variant="secondary" onClick={() => setEdicao(true)}>Editar</Button>}
                            </Row>
                        </Row>

                        <Grid $cols={3}>
                            <KeyValue label="Valor">{brl(lancamento.valor)}</KeyValue>
                            <KeyValue label={receber ? 'Recebido' : 'Pago'}>{brl(lancamento.valorPago)}</KeyValue>
                            <KeyValue label="Em aberto">{brl(lancamento.valorRestante)}</KeyValue>
                            <KeyValue label="Vencimento">{formatDate(lancamento.dataVencimento)}</KeyValue>
                            <KeyValue label="Emissão">{formatDate(lancamento.dataEmissao)}</KeyValue>
                            <KeyValue label="Documento">{lancamento.numeroDocumento}</KeyValue>
                            <KeyValue label={receber ? 'Cliente' : 'Fornecedor'}>
                                {receber && lancamento.cliente ? (
                                    <button
                                        type="button"
                                        onClick={() => setClienteAberto(true)}
                                        title="Ver usinas e financeiro do cliente"
                                        style={{ padding: 0, border: 0, background: 'none', color: 'var(--c-info)', font: 'inherit', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        {lancamento.cliente.nome}
                                    </button>
                                ) : parteDe(lancamento)}
                            </KeyValue>
                            <KeyValue label="Categoria">{lancamento.categoria?.nome}</KeyValue>
                            <KeyValue label="Conta">{lancamento.conta?.nome}</KeyValue>
                            {lancamento.contratoId && (
                                <KeyValue label="Contrato"><Link to={`/contratos/${lancamento.contratoId}`}>Ver contrato</Link></KeyValue>
                            )}
                        </Grid>
                        {lancamento.observacoes && <p style={{ marginTop: 12 }}><Muted>{lancamento.observacoes}</Muted></p>}

                        {receber && <BoletoSecao lancamento={lancamento} />}

                        <div style={{ marginTop: 18 }}>
                            <strong>Baixas</strong>
                            <DataTable
                                rows={lancamento.pagamentos}
                                emptyTitle="Nenhuma baixa registrada"
                                columns={[
                                    { key: 'data', header: 'Data', render: (p) => formatDate(p.dataPagamento) },
                                    { key: 'valor', header: 'Valor', render: (p) => <span style={{ textDecoration: p.estornadoEm ? 'line-through' : 'none' }}>{brl(p.valor)}</span> },
                                    { key: 'forma', header: 'Forma', render: (p) => formaLabel(p.forma) },
                                    { key: 'conta', header: 'Conta', render: (p) => p.conta?.nome ?? '—' },
                                    { key: 'origem', header: 'Origem', render: (p) => (p.origem === 'WEBHOOK_SICREDI' ? <Badge $tone="info">Aviso do banco</Badge> : p.origem === 'CONCILIACAO_SICREDI' ? <Badge $tone="info">Conciliação (banco)</Badge> : 'Manual') },
                                    {
                                        key: 'acoes',
                                        header: '',
                                        render: (p) => (p.estornadoEm
                                            ? <Badge>Estornado</Badge>
                                            : <Button size="sm" variant="ghost" onClick={() => setConfirmacao({ estornar: p })}>Estornar</Button>),
                                    },
                                ]}
                            />
                        </div>

                        <Row style={{ marginTop: 18 }}>
                            {!cancelado && ativos.length === 0 && (
                                <Button size="sm" variant="secondary" onClick={() => setConfirmacao('cancelar')}>Cancelar lançamento</Button>
                            )}
                            {cancelado && <Button size="sm" variant="secondary" onClick={() => acao.mutate('reabrir')}>Reabrir</Button>}
                            {lancamento.pagamentos.length === 0 && !lancamento.boleto && (
                                <Button size="sm" variant="danger" onClick={() => setConfirmacao('excluir')}>Excluir</Button>
                            )}
                        </Row>
                    </>
                )}
            </Dialog>

            <BaixaDialog open={baixa} lancamento={lancamento} onClose={() => setBaixa(false)} />
            {clienteAberto && lancamento?.cliente && <ClienteDialog clienteId={lancamento.cliente.id} onClose={() => setClienteAberto(false)} />}
            <LancamentoFormDialog open={edicao} lancamento={lancamento} onClose={() => setEdicao(false)} />

            <ConfirmDialog
                open={Boolean(confirmacao)}
                title={confirmacao === 'excluir' ? 'Excluir lançamento' : confirmacao === 'cancelar' ? 'Cancelar lançamento' : 'Estornar pagamento'}
                message={
                    confirmacao === 'excluir'
                        ? 'Excluir este lançamento? Esta ação não pode ser desfeita.'
                        : confirmacao === 'cancelar'
                            ? 'Cancelar este lançamento? Ele sai dos totais e pode ser reaberto depois.'
                            : `Estornar o pagamento de ${confirmacao?.estornar ? brl(confirmacao.estornar.valor) : ''}? O valor volta a ficar em aberto.`
                }
                confirmLabel={confirmacao === 'excluir' ? 'Excluir' : confirmacao === 'cancelar' ? 'Cancelar lançamento' : 'Estornar'}
                danger
                loading={acao.isPending}
                onConfirm={() => acao.mutate(confirmacao)}
                onClose={() => setConfirmacao(null)}
            />
        </>
    );
}
