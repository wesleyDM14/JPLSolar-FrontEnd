import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import ParteField from '../../../components/ParteField';
import { Button, DateField, Dialog, Grid, Muted, SelectField, TextField, TextareaField } from '../../../ui';
import CamposServico from './CamposServico';

const schema = Yup.object({
    valorServicos: Yup.number().typeError('Informe o valor').moreThan(0, 'Informe o valor do serviço').required('Informe o valor'),
    discriminacao: Yup.string().trim().min(3, 'Descreva o serviço prestado').required('Descreva o serviço prestado'),
    itemListaServico: Yup.string().trim().required('Informe o item da lista de serviços'),
});

const MOTIVOS = [
    { value: '1', label: '1 — Erro na emissão (correção de dados)' },
    { value: '2', label: '2 — Serviço não prestado como descrito' },
    { value: '4', label: '4 — Duplicidade da nota' },
];

/**
 * Correção de nota autorizada por substituição: emite uma nova NFS-e com os dados corrigidos e a prefeitura
 * cancela a original, registrando o vínculo entre as duas.
 */
export default function SubstituirNotaDialog({ nota, onClose }) {
    const queryClient = useQueryClient();

    const substituir = useMutation({
        mutationFn: (payload) => fiscalApi.substituirNfse(nota.id, payload),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            if (resultado.status === 'AUTORIZADA') {
                toast.success(`Nota nº ${resultado.numero} emitida em substituição à nº ${nota.numero}.`);
                onClose(resultado.notaId);
            } else {
                const detalhe = resultado.mensagens?.map((m) => `${m.codigo}: ${m.mensagem}`).join(' · ') || 'A prefeitura recusou a substituição.';
                toast.error(`Substituição recusada — ${detalhe}`, { duration: 9000 });
            }
        },
    });

    return (
        <Formik
            initialValues={{
                codigo: '1',
                clienteId: nota.cliente?.id ?? '',
                valorServicos: nota.valorServicos,
                discriminacao: nota.descricao ?? '',
                atividadeId: nota.atividade?.id ?? '',
                codigoCnae: nota.codigoCnae ?? '',
                itemListaServico: nota.itemListaServico ?? '',
                codigoTributacao: nota.codigoTributacao ?? '',
                aliquotaIss: nota.aliquotaIss ?? '',
                issRetido: nota.issRetido ? 'true' : 'false',
                competencia: nota.competencia ? `${nota.competencia}-01` : '',
            }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                try {
                    await substituir.mutateAsync({
                        codigo: Number(values.codigo),
                        clienteId: values.clienteId || undefined,
                        valorServicos: Number(values.valorServicos),
                        discriminacao: values.discriminacao,
                        atividadeId: values.atividadeId || undefined,
                        codigoCnae: values.codigoCnae || undefined,
                        itemListaServico: values.itemListaServico,
                        codigoTributacao: values.codigoTributacao || undefined,
                        aliquotaIss: values.aliquotaIss === '' ? undefined : Number(values.aliquotaIss),
                        issRetido: values.issRetido === 'true',
                        competencia: values.competencia || undefined,
                    });
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
                    width={700}
                    title={`Corrigir nota nº ${nota.numero}`}
                    subtitle="Emite uma nova nota no lugar desta; a original é cancelada pela prefeitura."
                    onClose={() => onClose()}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => onClose()}>Voltar</Button>
                            <Button type="submit" form="substituir-nfse-form" loading={isSubmitting}>Emitir nota substituta</Button>
                        </>
                    }
                >
                    <Form noValidate id="substituir-nfse-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            <Grid $cols={2}>
                                <SelectField name="codigo" label="Motivo da substituição" placeholder={null} options={MOTIVOS} />
                                <ParteField
                                    name="clienteId"
                                    parte="cliente"
                                    label="Cliente (tomador)"
                                    selecionadoInicial={nota.cliente ? { id: nota.cliente.id, nome: nota.cliente.nome } : undefined}
                                />
                                <TextField name="valorServicos" label="Valor do serviço (R$)" type="number" step="0.01" min="0" required />
                                <DateField name="competencia" label="Competência" />
                                <CamposServico />
                            </Grid>
                            <TextareaField name="discriminacao" label="Discriminação do serviço" rows={4} required />
                            <Muted>
                                A substituição só é aceita automaticamente até o dia 5 do mês seguinte à emissão; depois disso a prefeitura
                                analisa o pedido. Para apenas desfazer a nota, use “Cancelar nota”.
                            </Muted>
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}
