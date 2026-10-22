import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client';
import { muckApi } from '../../api/resources';
import { Button, Dialog, FilterInput, Muted, tokens } from '../../ui';
import { brl, horasTexto } from './format';
import { horasEntre } from './ServicoDialog';

const { colors } = tokens;

const agora = () => new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit', hour12: false });

/** Fecha um serviço em andamento: com o horário de término, calcula as horas, o valor e lança em contas a receber. */
export default function EncerrarDialog({ open, servico, onClose }) {
    const queryClient = useQueryClient();
    const [fim, setFim] = useState('');

    useEffect(() => {
        if (open) setFim(agora());
    }, [open]);

    const encerrar = useMutation({
        mutationFn: () => muckApi.atualizarOperacao(servico.id, { horaFim: fim }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Serviço encerrado. Já está em contas a receber.');
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    if (!open || !servico) return null;

    const horas = horasEntre(servico.horaInicio, fim);
    const total = horas === null ? null : Math.max(0, Math.round(horas * servico.valorHora * 100) / 100 - (servico.desconto || 0));

    return (
        <Dialog
            open={open}
            width={440}
            onClose={onClose}
            title="Encerrar serviço"
            subtitle={`${servico.cliente.nome} · ${servico.destino}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Agora não</Button>
                    <Button loading={encerrar.isPending} disabled={horas === null} onClick={() => encerrar.mutate()}>Encerrar e lançar</Button>
                </>
            }
        >
            <div style={{ display: 'grid', gap: 14 }}>
                <Muted>Começou às {servico.horaInicio}.</Muted>
                <FilterInput label="Terminou às" type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
                <div style={{ padding: 12, borderRadius: 10, background: colors.background, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    {horas === null ? (
                        <Muted>O término precisa ser depois do início, no mesmo dia.</Muted>
                    ) : (
                        <>
                            <Muted>{horasTexto(horas)} × {brl(servico.valorHora)}{servico.desconto > 0 ? ` − ${brl(servico.desconto)}` : ''}</Muted>
                            <strong style={{ fontSize: '1.15rem' }}>{brl(total)}</strong>
                        </>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
