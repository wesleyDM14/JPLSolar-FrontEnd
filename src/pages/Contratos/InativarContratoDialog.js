import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client';
import { contratosApi, financeiroApi } from '../../api/resources';
import { Button, Dialog, ErrorBlock, LoadingBlock, Muted, tokens } from '../../ui';
import { formatCurrency } from '../../utils/masks';

const { colors } = tokens;

const BOLETO_ENCERRADO = /^(BAIXADO|REJEITADO|LIQUIDADO)/i;

/**
 * Inativa o contrato e, se quiser, cancela junto as parcelas em aberto no financeiro.
 * Parcelas com pagamento parcial e as já pagas não são alteradas; boletos emitidos continuam no banco até a baixa.
 */
export default function InativarContratoDialog({ contrato, onClose }) {
    const queryClient = useQueryClient();
    const [cancelar, setCancelar] = useState(true);

    const parcelas = useQuery({
        queryKey: ['financeiro', 'contrato', 'parcelas', contrato.id],
        queryFn: () => financeiroApi.contratoParcelas(contrato.id),
    });

    const inativar = useMutation({
        mutationFn: () => contratosApi.updateStatus(contrato.id, 'CANCELADO', cancelar),
        onSuccess: async (resposta) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['contratos'] }),
                queryClient.invalidateQueries({ queryKey: ['contrato', contrato.id] }),
                queryClient.invalidateQueries({ queryKey: ['financeiro'] }),
            ]);
            toast.success(resposta.lancamentosCancelados > 0 ? `Contrato inativado e ${resposta.lancamentosCancelados} parcela(s) cancelada(s).` : 'Contrato inativado.');
            if (resposta.boletosParaBaixar > 0) {
                toast(`${resposta.boletosParaBaixar} boleto(s) ainda estão ativos no banco. Dê a baixa em Boletos > No banco.`, { duration: 9000 });
            }
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const lista = parcelas.data?.parcelas ?? [];
    const abertas = lista.filter((p) => p.status === 'ABERTO');
    const parciais = lista.filter((p) => p.status === 'PARCIAL');
    const totalAberto = abertas.reduce((soma, p) => soma + p.restante, 0);
    const boletosVivos = abertas.filter((p) => p.boleto && !BOLETO_ENCERRADO.test(p.boleto.situacao ?? '')).length;

    return (
        <Dialog
            open
            title="Inativar contrato"
            subtitle={contrato.cliente?.nome}
            width={480}
            onClose={inativar.isPending ? undefined : onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={inativar.isPending}>Voltar</Button>
                    <Button variant="danger" loading={inativar.isPending} disabled={parcelas.isLoading} onClick={() => inativar.mutate()}>Inativar contrato</Button>
                </>
            }
        >
            {parcelas.isLoading ? (
                <LoadingBlock />
            ) : parcelas.error ? (
                <ErrorBlock message={errorMessage(parcelas.error)} onRetry={parcelas.refetch} />
            ) : lista.length === 0 ? (
                <p style={{ margin: 0, lineHeight: 1.55 }}>Este contrato não tem parcelas no financeiro. Ele só muda de situação.</p>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    <p style={{ margin: 0, lineHeight: 1.55 }}>
                        {lista.length} parcela(s) no financeiro: {lista.filter((p) => p.status === 'PAGO').length} paga(s), {abertas.length} em aberto
                        {parciais.length > 0 ? `, ${parciais.length} com pagamento parcial` : ''}.
                    </p>

                    {abertas.length > 0 && (
                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10, background: colors.background, cursor: 'pointer' }}>
                            <input type="checkbox" checked={cancelar} onChange={(evento) => setCancelar(evento.target.checked)} style={{ marginTop: 3 }} />
                            <span>
                                <strong>Cancelar as {abertas.length} parcela(s) em aberto</strong>
                                <div><Muted>{formatCurrency(totalAberto)} deixam de aparecer em contas a receber.</Muted></div>
                            </span>
                        </label>
                    )}

                    {boletosVivos > 0 && cancelar && (
                        <Muted>{boletosVivos} dessas parcelas têm boleto ativo no banco. A baixa do boleto é feita em Boletos &gt; No banco.</Muted>
                    )}
                    {parciais.length > 0 && <Muted>As parcelas com pagamento parcial não são alteradas.</Muted>}
                </div>
            )}
        </Dialog>
    );
}
