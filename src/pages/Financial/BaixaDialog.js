import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Button, DateField, Dialog, Grid, Row, SelectField, TextField } from '../../ui';
import { brl, formaOptions, hojeIso, TIPO } from './format';

const schema = Yup.object({
    valor: Yup.number().typeError('Informe o valor').moreThan(0, 'O valor deve ser maior que zero').required('Informe o valor'),
    dataPagamento: Yup.string().required('Informe a data'),
});

/** Registra a baixa (pagamento/recebimento total ou parcial) de um lançamento. */
export default function BaixaDialog({ open, lancamento, onClose, onSaved }) {
    const queryClient = useQueryClient();
    const contas = useQuery({ queryKey: ['contas-financeiras'], queryFn: financeiroApi.contasFinanceiras, enabled: open });

    const baixar = useMutation({
        mutationFn: (payload) => financeiroApi.baixar(lancamento.id, payload),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(lancamento.tipo === TIPO.RECEBER ? 'Recebimento registrado.' : 'Pagamento registrado.');
            onSaved?.(resultado);
            onClose();
        },
    });

    if (!open || !lancamento) return null;

    const receber = lancamento.tipo === TIPO.RECEBER;
    const contaOptions = (contas.data ?? []).filter((conta) => conta.ativa).map((conta) => ({ value: conta.id, label: conta.nome }));

    return (
        <Formik
            initialValues={{
                valor: lancamento.valorRestante,
                dataPagamento: hojeIso(),
                forma: 'PIX',
                contaId: lancamento.conta?.id ?? '',
                observacao: '',
            }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                try {
                    await baixar.mutateAsync({
                        valor: Number(values.valor),
                        dataPagamento: values.dataPagamento,
                        forma: values.forma,
                        contaId: values.contaId || undefined,
                        observacao: values.observacao || undefined,
                    });
                } catch (erro) {
                    const campos = fieldErrors(erro);
                    if (Object.keys(campos).length > 0) setErrors(campos);
                    else toast.error(errorMessage(erro));
                }
            }}
        >
            {({ isSubmitting, setFieldValue }) => (
                <Dialog open={open} width={520} onClose={onClose} title={receber ? 'Registrar recebimento' : 'Registrar pagamento'}>
                    <p style={{ marginBottom: 12 }}>
                        <strong>{lancamento.descricao}</strong>
                        <br />
                        Valor {brl(lancamento.valor)} · já {receber ? 'recebido' : 'pago'} {brl(lancamento.valorPago)} · em aberto{' '}
                        <strong>{brl(lancamento.valorRestante)}</strong>
                    </p>

                    <Form noValidate id="baixa-form">
                        <Grid $cols={2}>
                            <TextField name="valor" label="Valor (R$)" type="number" step="0.01" min="0" required autoFocus />
                            <DateField name="dataPagamento" label="Data" required />
                        </Grid>
                        <Grid $cols={2}>
                            <SelectField name="forma" label="Forma" options={formaOptions} placeholder="Selecione" />
                            <SelectField name="contaId" label="Conta" options={contaOptions} placeholder="Sem conta" />
                        </Grid>
                        <TextField name="observacao" label="Observação" />
                    </Form>

                    <Row $justify="space-between" style={{ marginTop: 20 }}>
                        <Button variant="ghost" size="sm" onClick={() => setFieldValue('valor', lancamento.valorRestante)}>
                            Valor total em aberto
                        </Button>
                        <Row>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="baixa-form" loading={isSubmitting || baixar.isPending}>Confirmar</Button>
                        </Row>
                    </Row>
                </Dialog>
            )}
        </Formik>
    );
}
