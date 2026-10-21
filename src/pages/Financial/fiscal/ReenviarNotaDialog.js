import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import ParteField from '../../../components/ParteField';
import { Button, DateField, Dialog, Grid, Muted, TextField, TextareaField, tokens } from '../../../ui';
import CamposServico from './CamposServico';

const { colors } = tokens;

const schema = Yup.object({
    valorServicos: Yup.number().typeError('Informe o valor').moreThan(0, 'Informe o valor do serviço').required('Informe o valor'),
    discriminacao: Yup.string().trim().min(3, 'Descreva o serviço prestado').required('Descreva o serviço prestado'),
    itemListaServico: Yup.string().trim().required('Informe o item da lista de serviços'),
});

/**
 * Corrige e reenvia à prefeitura uma nota rejeitada. Usa o mesmo número de RPS: a nota recusada não consumiu numeração.
 * Os motivos da recusa ficam no topo para orientar o que ajustar.
 */
export default function ReenviarNotaDialog({ nota, onClose }) {
    const queryClient = useQueryClient();

    const reenviar = useMutation({
        mutationFn: (payload) => fiscalApi.reenviarNfse(nota.id, payload),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            if (resultado.status === 'AUTORIZADA') {
                toast.success(`Nota nº ${resultado.numero} emitida.`);
                onClose(resultado.notaId);
            } else {
                const detalhe = resultado.mensagens?.map((m) => `${m.codigo}: ${m.mensagem}`).join(' · ') || 'A prefeitura recusou a nota.';
                toast.error(`Recusada de novo — ${detalhe}`, { duration: 12000 });
                onClose(resultado.notaId);
            }
        },
    });

    return (
        <Formik
            initialValues={{
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
                codigoObra: '',
                art: '',
                informacoesComplementares: '',
            }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                try {
                    await reenviar.mutateAsync({
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
                        codigoObra: values.codigoObra || undefined,
                        art: values.art || undefined,
                        informacoesComplementares: values.informacoesComplementares || undefined,
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
                    width={720}
                    title="Corrigir e reenviar nota"
                    subtitle={`RPS ${nota.rpsNumero ?? ''} / ${nota.rpsSerie ?? ''} — a prefeitura recusou esta nota.`}
                    onClose={() => onClose()}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => onClose()}>Voltar</Button>
                            <Button type="submit" form="reenviar-nfse-form" loading={isSubmitting}>Reenviar à prefeitura</Button>
                        </>
                    }
                >
                    <Form noValidate id="reenviar-nfse-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            {nota.mensagens?.length > 0 && (
                                <div style={{ padding: 12, borderRadius: 10, background: colors.dangerBg, color: colors.danger, fontSize: '0.9rem', display: 'grid', gap: 4 }}>
                                    <strong>Motivos da recusa</strong>
                                    {nota.mensagens.map((m, i) => (
                                        <div key={`${m.codigo}-${i}`}>{m.codigo}: {m.mensagem}{m.correcao ? ` — ${m.correcao}` : ''}</div>
                                    ))}
                                </div>
                            )}

                            <Grid $cols={2}>
                                <ParteField
                                    name="clienteId"
                                    parte="cliente"
                                    label="Cliente (tomador)"
                                    selecionadoInicial={nota.cliente ? { id: nota.cliente.id, nome: nota.cliente.nome } : undefined}
                                />
                                <TextField name="valorServicos" label="Valor do serviço (R$)" type="number" step="0.01" min="0" required />
                                <DateField name="competencia" label="Competência" />
                                <CamposServico />
                                <TextField name="codigoObra" label="Código da obra (CNO)" hint="Exigido em serviços de obra (item 07.02)." />
                                <TextField name="art" label="ART (opcional)" />
                            </Grid>
                            <TextareaField name="discriminacao" label="Discriminação do serviço" rows={4} required />
                            <TextareaField name="informacoesComplementares" label="Informações complementares" rows={2} />
                            <Muted>A data de emissão passa a ser a de hoje. Se a prefeitura recusar de novo, os novos motivos aparecem na nota.</Muted>
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}
