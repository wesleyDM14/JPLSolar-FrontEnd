import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { Button, Dialog, Grid, Muted, TextField, TextareaField } from '../../../ui';

const schema = Yup.object({
    quantidade: Yup.number().typeError('Informe a quantidade').integer('Número inteiro').min(1, 'Mínimo 1').max(50, 'Máximo 50').required('Informe a quantidade'),
    motivo: Yup.string().trim().min(15, 'Explique o motivo (mínimo de 15 caracteres)').required('Explique o motivo'),
});

/**
 * Pula números do RPS e registra o motivo (ex.: números usados em outro sistema ou perdidos). A prefeitura não
 * tem operação de inutilização: o controle fica no sistema, para a sequência ter explicação.
 */
export default function InutilizarNumeracaoDialog({ open, onClose }) {
    const queryClient = useQueryClient();

    const inutilizar = useMutation({
        mutationFn: (payload) => fiscalApi.inutilizarNumeracao(payload),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success(resultado.de === resultado.ate ? `RPS ${resultado.de} inutilizado.` : `RPS ${resultado.de} a ${resultado.ate} inutilizados.`);
            onClose();
        },
    });

    if (!open) return null;

    return (
        <Formik
            initialValues={{ quantidade: 1, motivo: '' }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                try {
                    await inutilizar.mutateAsync({ quantidade: Number(values.quantidade), motivo: values.motivo.trim() });
                } catch (erro) {
                    const campos = fieldErrors(erro);
                    if (Object.keys(campos).length > 0) setErrors(campos);
                    else toast.error(errorMessage(erro));
                }
            }}
        >
            {({ isSubmitting }) => (
                <Dialog
                    open
                    width={540}
                    title="Inutilizar numeração"
                    subtitle="Pula os próximos números do RPS e registra o motivo."
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="inutilizar-numeracao-form" variant="danger" loading={isSubmitting}>Inutilizar</Button>
                        </>
                    }
                >
                    <Form noValidate id="inutilizar-numeracao-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            <Grid $cols={2}>
                                <TextField name="quantidade" label="Quantos números pular" type="number" min="1" max="50" required />
                            </Grid>
                            <TextareaField name="motivo" label="Motivo" rows={3} required hint="Fica registrado em cada número inutilizado." />
                            <Muted>
                                Use para números que não serão emitidos por este sistema. Para um RPS já enviado que não virou nota,
                                abra a nota (Pendente ou Rejeitada) e escolha “Inutilizar número”.
                            </Muted>
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}
