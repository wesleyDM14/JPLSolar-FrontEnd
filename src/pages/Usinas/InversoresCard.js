import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client';
import { usinasApi } from '../../api/resources';
import { Badge, Button, Card, CardTitle, Muted } from '../../ui';
import { dataHoraBr } from '../../utils/datas';
import { usinaStatus } from '../../utils/usinaStatus';

const num = (v, casas = 1) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas }));

/**
 * Cada inversor da usina na última leitura. Inativo = parado há mais de 30 dias enquanto outro funciona, ou ignorado à mão:
 * não conta no estado nem na geração.
 */
export default function InversoresCard({ usinaId, inversores }) {
    const queryClient = useQueryClient();

    const ignorar = useMutation({
        mutationFn: ({ serie, ignorado }) => usinasApi.ignorarInversor(usinaId, serie, ignorado),
        onSuccess: async (_dados, { ignorado }) => {
            await queryClient.invalidateQueries({ queryKey: ['usina', usinaId] });
            await queryClient.invalidateQueries({ queryKey: ['usinas'] });
            toast.success(ignorado ? 'Inversor ignorado. A usina foi reavaliada sem ele.' : 'Inversor voltou a ser monitorado.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    if (!Array.isArray(inversores) || inversores.length === 0) return null;

    const ativos = inversores.filter((i) => i.ativo).length;

    return (
        <Card>
            <CardTitle>Inversores ({ativos} {ativos === 1 ? 'ativo' : 'ativos'}{inversores.length > ativos ? `, ${inversores.length - ativos} inativo(s)` : ''})</CardTitle>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--c-muted)', fontSize: '0.8rem' }}>
                            <th style={{ padding: '6px 8px' }}>Inversor</th>
                            <th style={{ padding: '6px 8px' }}>Situação</th>
                            <th style={{ padding: '6px 8px' }}>Potência agora</th>
                            <th style={{ padding: '6px 8px' }}>Hoje</th>
                            <th style={{ padding: '6px 8px' }}>Total</th>
                            <th style={{ padding: '6px 8px' }}>Última comunicação</th>
                            <th style={{ padding: '6px 8px' }} />
                        </tr>
                    </thead>
                    <tbody>
                        {inversores.map((i) => {
                            const status = usinaStatus(i.status);
                            const semDados = !i.ultimaComunicacao;
                            return (
                                <tr key={i.id} style={{ borderTop: '1px solid var(--c-border)', opacity: i.ativo ? 1 : 0.6 }}>
                                    <td style={{ padding: '8px' }}>
                                        <strong>{i.nome || i.id}</strong>
                                        <div><Muted style={{ fontSize: '0.8rem' }}>{i.nome ? i.id : ''}</Muted></div>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        {i.ativo ? (
                                            <Badge $tone={status.tone}>{i.status === 'OFFLINE' ? 'Sem comunicação' : status.label}</Badge>
                                        ) : (
                                            <Badge $tone="neutral">{i.ignorado ? 'Ignorado por você' : 'Inativo (sem dados recentes)'}</Badge>
                                        )}
                                    </td>
                                    <td style={{ padding: '8px' }}>{i.ativo ? `${num(i.potenciaW, 0)} W` : '—'}</td>
                                    <td style={{ padding: '8px' }}>{i.ativo ? `${num(i.energiaHojeKwh)} kWh` : '—'}</td>
                                    <td style={{ padding: '8px' }}>{num(i.energiaTotalKwh, 0)} kWh</td>
                                    <td style={{ padding: '8px' }}>{i.ultimaComunicacao ? dataHoraBr(i.ultimaComunicacao) : '—'}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                        {!semDados && (i.ignorado || i.ativo) && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                loading={ignorar.isPending && ignorar.variables?.serie === i.id}
                                                title={i.ignorado ? 'Voltar a contar este inversor' : 'Não contar este inversor (aposentado, trocado ou fora de uso)'}
                                                onClick={() => ignorar.mutate({ serie: i.id, ignorado: !i.ignorado })}
                                            >
                                                {i.ignorado ? 'Voltar a monitorar' : 'Ignorar'}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
