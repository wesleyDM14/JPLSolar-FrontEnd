import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaLink } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { financeiroApi } from '../../../api/resources';
import { Badge, Button, Dialog, ErrorBlock, LoadingBlock, Muted, tokens } from '../../../ui';
import { formatDate } from '../../../utils/masks';
import { brl } from '../format';

const { colors } = tokens;

const Linha = styled.label`
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: 10px;
    align-items: start;
    padding: 10px 12px;
    margin-bottom: 8px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surface};
    cursor: pointer;

    input {
        width: 17px;
        height: 17px;
        margin-top: 2px;
        accent-color: ${colors.primary};
    }
`;

/** Sugere o par boleto x parcela (mesmo CPF/CNPJ, valor e número da parcela) e vincula os confirmados de uma vez. */
export default function VinculoAutomaticoDialog({ onClose }) {
    const queryClient = useQueryClient();
    const [marcados, setMarcados] = useState([]);

    const propostas = useQuery({
        queryKey: ['financeiro', 'boletos', 'banco', 'vinculos-automaticos'],
        queryFn: financeiroApi.vinculosAutomaticos,
    });

    useEffect(() => {
        if (propostas.data) setMarcados(propostas.data.map((p) => p.nossoNumero));
    }, [propostas.data]);

    const aplicar = useMutation({
        mutationFn: () =>
            financeiroApi.aplicarVinculosAutomaticos(
                (propostas.data ?? []).filter((p) => marcados.includes(p.nossoNumero)).map((p) => ({ nossoNumero: p.nossoNumero, lancamentoId: p.lancamentoId })),
            ),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(`${resultado.vinculados} boleto(s) vinculado(s)${resultado.baixados ? `, ${resultado.baixados} já pago(s) baixado(s)` : ''}${resultado.falhas.length ? `; ${resultado.falhas.length} com problema` : ''}.`);
            if (resultado.falhas.length > 0) toast.error(resultado.falhas[0].motivo, { duration: 8000 });
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const lista = propostas.data ?? [];
    const alternar = (nn) => setMarcados((atual) => (atual.includes(nn) ? atual.filter((x) => x !== nn) : [...atual, nn]));

    return (
        <Dialog
            open
            width={820}
            title="Vincular automaticamente"
            subtitle="Mesmo CPF/CNPJ, mesmo valor e parcela correspondente. Confira antes de confirmar."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                    <Button icon={<FaLink />} loading={aplicar.isPending} disabled={marcados.length === 0} onClick={() => aplicar.mutate()}>
                        Vincular {marcados.length || ''}
                    </Button>
                </>
            }
        >
            {propostas.isLoading && <LoadingBlock />}
            {propostas.error && <ErrorBlock message={errorMessage(propostas.error)} onRetry={propostas.refetch} />}
            {propostas.data && lista.length === 0 && <Muted>Nenhum par encontrado. Use “Vincular” em cada boleto.</Muted>}

            {lista.length > 0 && (
                <Row todos={marcados.length === lista.length} onToggle={() => setMarcados(marcados.length === lista.length ? [] : lista.map((p) => p.nossoNumero))} total={lista.length} />
            )}

            {lista.map((p) => {
                const mudaVencimento = p.vencimentoBoleto && String(p.vencimentoBoleto).slice(0, 10) !== String(p.vencimentoLancamento).slice(0, 10);
                return (
                    <Linha key={p.nossoNumero}>
                        <input type="checkbox" checked={marcados.includes(p.nossoNumero)} onChange={() => alternar(p.nossoNumero)} />
                        <div style={{ minWidth: 0 }}>
                            <strong style={{ fontWeight: 600 }}>{p.pagador ?? 'Pagador não identificado'}</strong>
                            <div>
                                <Muted style={{ fontSize: '0.82rem' }}>
                                    Boleto {p.nossoNumeroFormatado}{p.seuNumero ? ` (${p.seuNumero})` : ''} → {p.lancamento}{p.parcela ? ` · parcela ${p.parcela}` : ''}
                                </Muted>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                {mudaVencimento ? (
                                    <Badge $tone="warning">Vencimento: {formatDate(p.vencimentoLancamento)} → {formatDate(p.vencimentoBoleto)}</Badge>
                                ) : (
                                    <Muted style={{ fontSize: '0.8rem' }}>Vence {p.vencimentoBoleto ? formatDate(p.vencimentoBoleto) : '—'}</Muted>
                                )}{' '}
                                <Muted style={{ fontSize: '0.8rem' }}>· {p.motivo}</Muted>
                            </div>
                        </div>
                        <strong>{brl(p.valor)}</strong>
                    </Linha>
                );
            })}
        </Dialog>
    );
}

function Row({ todos, onToggle, total }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={todos} onChange={onToggle} />
            {total} par(es) sugerido(s)
        </label>
    );
}
