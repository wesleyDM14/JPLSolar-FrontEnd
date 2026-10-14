import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { errorMessage, fieldErrors } from '../../../api/client';
import { financeiroApi } from '../../../api/resources';
import { Badge, Button, Dialog, Muted } from '../../../ui';
import { dataBr, hojeIso } from '../../../utils/datas';
import { brl } from '../format';
import { OPCOES_PADRAO, OpcoesBoletoCampos, opcoesParaApi, opcoesSchema } from './OpcoesBoleto';

/** Emissão de um boleto (Sicredi) para o lançamento, com as condições de cobrança. */
export default function EmitirBoletoDialog({ lancamento, onClose }) {
    const queryClient = useQueryClient();
    const vencimentoIso = String(lancamento.dataVencimento).slice(0, 10);
    const vencido = vencimentoIso < hojeIso();

    const emitir = useMutation({
        mutationFn: (corpo) => financeiroApi.emitirBoleto(lancamento.id, corpo),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Boleto emitido.');
            onClose();
        },
    });

    return (
        <Formik
            initialValues={OPCOES_PADRAO}
            validationSchema={opcoesSchema}
            onSubmit={async (valores, { setErrors }) => {
                try {
                    await emitir.mutateAsync(opcoesParaApi(valores));
                } catch (erro) {
                    const campos = fieldErrors(erro);
                    if (Object.keys(campos).length > 0) setErrors(campos);
                    else toast.error(errorMessage(erro));
                }
            }}
        >
            {({ isSubmitting, values }) => (
                <Dialog
                    open
                    width={640}
                    title="Emitir boleto"
                    subtitle={`${lancamento.descricao} · ${brl(lancamento.valor)} · vence em ${dataBr(vencimentoIso)}`}
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="emitir-boleto" loading={isSubmitting} disabled={vencido}>Emitir boleto</Button>
                        </>
                    }
                >
                    {vencido && (
                        <p style={{ marginBottom: 12 }}>
                            <Badge $tone="danger">Vencimento passado</Badge>{' '}
                            <Muted>O Sicredi não registra boleto vencido. Edite o vencimento do lançamento e emita novamente.</Muted>
                        </p>
                    )}
                    <Form noValidate id="emitir-boleto">
                        <OpcoesBoletoCampos valores={values} />
                    </Form>
                    <p style={{ marginTop: 12 }}>
                        <Muted>
                            O boleto é registrado no Sicredi com o valor e o vencimento do lançamento, em nome de {lancamento.cliente?.nome ?? 'o cliente'}.
                            Depois de emitido, o vencimento só muda pelo botão "Gerenciar boleto".
                        </Muted>
                    </p>
                </Dialog>
            )}
        </Formik>
    );
}
