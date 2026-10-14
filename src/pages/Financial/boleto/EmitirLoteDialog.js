import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { errorMessage } from '../../../api/client';
import { financeiroApi } from '../../../api/resources';
import { Badge, Button, Dialog, ErrorBlock, LoadingBlock, Muted } from '../../../ui';
import { dataBr, hojeIso } from '../../../utils/datas';
import { brl } from '../format';
import { OPCOES_PADRAO, OpcoesBoletoCampos, opcoesParaApi, opcoesSchema } from './OpcoesBoleto';

const LIMITE = 100;

/** Emite de uma vez os boletos das contas a receber (do filtro atual) que ainda não têm boleto. */
export default function EmitirLoteDialog({ filtros, onClose }) {
    const queryClient = useQueryClient();

    const candidatos = useQuery({
        queryKey: ['financeiro', 'lote-boletos', filtros],
        queryFn: () => financeiroApi.lancamentos({ ...filtros, tipo: 'RECEBER', boleto: 'SEM_BOLETO', situacao: '', page: 1, pageSize: LIMITE, sort: 'dataVencimento:asc' }),
    });

    const emitir = useMutation({
        mutationFn: ({ ids, opcoes }) => financeiroApi.boletosEmLote({ ids, opcoes }),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(`${resultado.emitidos} boleto(s) emitido(s).`);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const hoje = hojeIso();
    const todos = candidatos.data?.data ?? [];
    const emissiveis = todos.filter((l) => String(l.dataVencimento).slice(0, 10) >= hoje && l.cliente);
    const ignorados = todos.length - emissiveis.length;
    const total = candidatos.data?.meta?.total ?? todos.length;
    const soma = emissiveis.reduce((acc, l) => acc + Number(l.valor), 0);
    const resultado = emitir.data;

    return (
        <Formik
            initialValues={OPCOES_PADRAO}
            validationSchema={opcoesSchema}
            onSubmit={(valores) => emitir.mutateAsync({ ids: emissiveis.map((l) => l.id), opcoes: opcoesParaApi(valores) }).catch(() => undefined)}
        >
            {({ isSubmitting, values }) => (
                <Dialog
                    open
                    width={680}
                    title="Emitir boletos em lote"
                    subtitle="Contas a receber do filtro atual que ainda não têm boleto."
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>{resultado ? 'Fechar' : 'Cancelar'}</Button>
                            {!resultado && (
                                <Button type="submit" form="boletos-lote" loading={isSubmitting} disabled={emissiveis.length === 0}>
                                    Emitir {emissiveis.length} boleto(s)
                                </Button>
                            )}
                        </>
                    }
                >
                    {candidatos.isLoading && <LoadingBlock />}
                    {candidatos.error && <ErrorBlock message={errorMessage(candidatos.error)} onRetry={candidatos.refetch} />}

                    {candidatos.data && !resultado && (
                        <>
                            {emissiveis.length === 0 ? (
                                <p><Muted>Nenhuma conta a receber sem boleto neste filtro (com cliente e vencimento a partir de hoje).</Muted></p>
                            ) : (
                                <>
                                    <p>
                                        <strong>{emissiveis.length}</strong> boleto(s) · <strong>{brl(soma)}</strong>
                                        {total > LIMITE && <> <Badge $tone="warning">limite de {LIMITE} por vez</Badge></>}
                                    </p>
                                    <ul style={{ margin: '6px 0 12px', paddingLeft: 18, maxHeight: 150, overflow: 'auto' }}>
                                        {emissiveis.slice(0, 12).map((l) => (
                                            <li key={l.id}>{l.cliente?.nome} — {l.descricao} · {brl(l.valor)} · vence {dataBr(String(l.dataVencimento).slice(0, 10))}</li>
                                        ))}
                                        {emissiveis.length > 12 && <li><Muted>e mais {emissiveis.length - 12}…</Muted></li>}
                                    </ul>
                                    {ignorados > 0 && <p><Badge $tone="warning">{ignorados} ignorado(s)</Badge> <Muted>vencimento passado ou sem cliente.</Muted></p>}
                                    <Form noValidate id="boletos-lote">
                                        <OpcoesBoletoCampos valores={values} />
                                    </Form>
                                </>
                            )}
                        </>
                    )}

                    {resultado && (
                        <div>
                            <p><Badge $tone="success">{resultado.emitidos} emitido(s)</Badge> {resultado.falhas.length > 0 && <Badge $tone="danger">{resultado.falhas.length} com falha</Badge>}</p>
                            {resultado.falhas.length > 0 && (
                                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                    {resultado.falhas.slice(0, 15).map((f) => (
                                        <li key={f.lancamentoId}><strong>{f.descricao || 'Lançamento'}</strong>: {f.motivo}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </Dialog>
            )}
        </Formik>
    );
}
