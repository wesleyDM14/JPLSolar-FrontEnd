import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { errorMessage } from '../../../api/client';
import { sicrediApi } from '../../../api/resources';
import { Badge, Button, Dialog, FilterInput, Grid, Muted, Row, StatCard, StatGrid } from '../../../ui';
import { dataBr, hojeIso, somarDias } from '../../../utils/datas';
import { brl } from '../format';

/** Busca no Sicredi as liquidações do período e dá baixa nos lançamentos que ainda estão em aberto. */
export default function ConciliarDialog({ onClose }) {
    const queryClient = useQueryClient();
    const [de, setDe] = useState(somarDias(hojeIso(), -7));
    const [ate, setAte] = useState(hojeIso());

    const sincronizar = useMutation({
        mutationFn: () => sicrediApi.sincronizar({ de, ate }),
        onSuccess: async (resumo) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            await queryClient.invalidateQueries({ queryKey: ['notificacoes-contagem'] });
            toast.success(resumo.baixados > 0 ? `${resumo.baixados} boleto(s) baixado(s).` : 'Conciliação concluída.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const resumo = sincronizar.data;
    const periodoInvalido = !de || !ate || ate < de;

    return (
        <Dialog
            open
            width={680}
            title="Conciliar com o Sicredi"
            subtitle="Baixa os lançamentos dos boletos pagos no período."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                    <Button loading={sincronizar.isPending} disabled={periodoInvalido} onClick={() => sincronizar.mutate()}>Conciliar período</Button>
                </>
            }
        >
            <Grid $cols={2}>
                <FilterInput label="De" type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} />
                <FilterInput label="Até" type="date" value={ate} min={de} max={hojeIso()} onChange={(e) => setAte(e.target.value)} />
            </Grid>
            <Row style={{ marginTop: 10 }}>
                <Button size="sm" variant="ghost" onClick={() => { setDe(hojeIso()); setAte(hojeIso()); }}>Hoje</Button>
                <Button size="sm" variant="ghost" onClick={() => { setDe(somarDias(hojeIso(), -7)); setAte(hojeIso()); }}>Últimos 7 dias</Button>
                <Button size="sm" variant="ghost" onClick={() => { setDe(somarDias(hojeIso(), -30)); setAte(hojeIso()); }}>Últimos 30 dias</Button>
            </Row>

            {resumo && (
                <div style={{ marginTop: 16 }}>
                    <StatGrid>
                        <StatCard icon={FaCheckCircle} tom="green" rotulo="Baixados agora" valor={resumo.baixados} detalhe={`${resumo.liquidacoes} liquidação(ões) no banco`} />
                        <StatCard icon={FaCheckCircle} tom="blue" rotulo="Já registrados" valor={resumo.duplicados + resumo.jaQuitados} detalhe="sem alteração" />
                        <StatCard
                            icon={FaExclamationTriangle}
                            tom={resumo.naoEncontrados.length > 0 ? 'orange' : 'gray'}
                            rotulo="Sem lançamento"
                            valor={resumo.naoEncontrados.length}
                            detalhe="pagos sem lançamento"
                        />
                    </StatGrid>

                    {resumo.naoEncontrados.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <strong>Pagos sem lançamento</strong>
                            <ul style={{ margin: '6px 0 0', paddingLeft: 0, listStyle: 'none' }}>
                                {resumo.naoEncontrados.slice(0, 30).map((item) => (
                                    <li key={`${item.nossoNumero}-${item.dia}`} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                        <strong>{item.pagador?.nome ?? 'Pagador não identificado'}</strong>
                                        {item.pagador?.documento ? <Muted> · {item.pagador.documento}</Muted> : null}
                                        <div>
                                            <Muted>
                                                {brl(item.valor)} · pago em {dataBr(item.dia)}
                                                {item.vencimento ? ` · venc. ${dataBr(item.vencimento)}` : ''}
                                                {item.seuNumero ? ` · ${item.seuNumero}` : ''} · {item.nossoNumero}
                                            </Muted>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {resumo.naoEncontrados.length > 30 && <Muted>E mais {resumo.naoEncontrados.length - 30}…</Muted>}
                            <p style={{ marginTop: 8 }}><Muted>Vincule em Boletos → No banco → Pagos → Sem lançamento.</Muted></p>
                        </div>
                    )}

                    {resumo.cancelados > 0 && (
                        <p style={{ marginTop: 10 }}><Badge $tone="warning">{resumo.cancelados} em lançamento cancelado</Badge> <Muted>Confira em Notificações.</Muted></p>
                    )}

                    {resumo.erros.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <Badge $tone="danger">Avisos do banco</Badge>
                            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                {resumo.erros.slice(0, 8).map((erro) => <li key={erro}>{erro}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
}
