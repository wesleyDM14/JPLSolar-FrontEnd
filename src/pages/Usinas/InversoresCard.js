import { Badge, Card, CardTitle, Muted } from '../../ui';
import { dataHoraBr } from '../../utils/datas';
import { usinaStatus } from '../../utils/usinaStatus';

const num = (v, casas = 1) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas }));

/** Cada inversor da usina na última leitura. Inativo = parado há mais de 30 dias enquanto outro funciona: não conta no estado nem na geração. */
export default function InversoresCard({ inversores }) {
    if (!Array.isArray(inversores) || inversores.length === 0) return null;

    const ativos = inversores.filter((i) => i.ativo).length;

    return (
        <Card>
            <CardTitle>Inversores ({ativos} {ativos === 1 ? 'ativo' : 'ativos'}{inversores.length > ativos ? `, ${inversores.length - ativos} inativo(s)` : ''})</CardTitle>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--c-muted)', fontSize: '0.8rem' }}>
                            <th style={{ padding: '6px 8px' }}>Inversor</th>
                            <th style={{ padding: '6px 8px' }}>Situação</th>
                            <th style={{ padding: '6px 8px' }}>Potência agora</th>
                            <th style={{ padding: '6px 8px' }}>Hoje</th>
                            <th style={{ padding: '6px 8px' }}>Total</th>
                            <th style={{ padding: '6px 8px' }}>Última comunicação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inversores.map((i) => {
                            const status = usinaStatus(i.status);
                            return (
                                <tr key={i.id} style={{ borderTop: '1px solid var(--c-border)', opacity: i.ativo ? 1 : 0.6 }}>
                                    <td style={{ padding: '8px' }}>
                                        <strong>{i.nome || i.id}</strong>
                                        <div><Muted style={{ fontSize: '0.8rem' }}>{i.nome ? i.id : ''}</Muted></div>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        {i.ativo ? <Badge $tone={status.tone}>{status.label}</Badge> : <Badge $tone="neutral">Inativo (sem dados recentes)</Badge>}
                                    </td>
                                    <td style={{ padding: '8px' }}>{i.ativo ? `${num(i.potenciaW, 0)} W` : '—'}</td>
                                    <td style={{ padding: '8px' }}>{i.ativo ? `${num(i.energiaHojeKwh)} kWh` : '—'}</td>
                                    <td style={{ padding: '8px' }}>{num(i.energiaTotalKwh, 0)} kWh</td>
                                    <td style={{ padding: '8px' }}>{i.ultimaComunicacao ? dataHoraBr(i.ultimaComunicacao) : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
