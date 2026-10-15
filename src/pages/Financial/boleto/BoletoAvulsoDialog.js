import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage } from '../../../api/client';
import { financeiroApi } from '../../../api/resources';
import ParteField from '../../../components/ParteField';
import { Button, DateField, Dialog, Grid, Muted, SelectField, TextField } from '../../../ui';
import { brl } from '../format';
import { OPCOES_PADRAO, OpcoesBoletoCampos, opcoesParaApi, opcoesSchema } from './OpcoesBoleto';

const hojeIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });

const schema = opcoesSchema.concat(
    Yup.object({
        clienteId: Yup.string().required('Escolha o cliente'),
        descricao: Yup.string().trim().required('Informe a descrição'),
        valor: Yup.number().typeError('Informe o valor').moreThan(0, 'Maior que zero').required('Informe o valor'),
        quantidade: Yup.number().typeError('Informe a quantidade').integer('Número inteiro').min(1, 'Mínimo 1').max(60, 'Máximo 60').required('Informe a quantidade'),
        dataVencimento: Yup.string().required('Informe o 1º vencimento'),
    }),
);

/**
 * Boletos avulsos para um cliente, sem contrato: um boleto só ou várias parcelas mensais de uma vez.
 * Cria as contas a receber e já emite os boletos no Sicredi.
 */
export default function BoletoAvulsoDialog({ open, cliente, onClose }) {
    const queryClient = useQueryClient();
    const [progresso, setProgresso] = useState(null);

    if (!open) return null;

    const emitirEmPedacos = async (ids, opcoes) => {
        const total = ids.length;
        const resultado = { emitidos: 0, falhas: [] };
        setProgresso({ feitos: 0, total });

        for (let inicio = 0; inicio < total; inicio += 8) {
            const parte = await financeiroApi.boletosEmLote({ ids: ids.slice(inicio, inicio + 8), opcoes });
            resultado.emitidos += parte.emitidos;
            resultado.falhas.push(...parte.falhas);
            setProgresso({ feitos: Math.min(inicio + 8, total), total });
            if (parte.emitidos === 0 && parte.falhas.length > 0 && parte.falhas.every((f) => /credenciais|limitou|não respondeu|falar com o Sicredi/i.test(f.motivo))) break;
        }

        return resultado;
    };

    return (
        <Formik
            initialValues={{
                clienteId: cliente?.id ?? '',
                descricao: '',
                valor: '',
                quantidade: 1,
                modo: 'REPETIR',
                dataVencimento: hojeIso(),
                emitir: 'true',
                ...OPCOES_PADRAO,
            }}
            validationSchema={schema}
            onSubmit={async (valores, { setSubmitting }) => {
                try {
                    const quantidade = Number(valores.quantidade);
                    const criadas = await financeiroApi.createLancamento({
                        tipo: 'RECEBER',
                        descricao: valores.descricao.trim(),
                        valor: Number(valores.valor),
                        dataVencimento: valores.dataVencimento,
                        clienteId: valores.clienteId,
                        ...(quantidade > 1 ? { repeticao: { quantidade, modo: valores.modo } } : {}),
                    });
                    const ids = criadas.map((c) => c.id);
                    toast.success(`${ids.length} conta(s) a receber criada(s).`);

                    if (valores.emitir === 'true') {
                        const boletos = await emitirEmPedacos(ids, opcoesParaApi(valores));
                        toast.success(`${boletos.emitidos} boleto(s) emitido(s) no Sicredi.`);
                        if (boletos.falhas.length > 0) toast.error(`${boletos.falhas.length} não emitido(s): ${boletos.falhas[0].motivo}`, { duration: 9000 });
                    }

                    await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
                    onClose();
                } catch (erro) {
                    toast.error(errorMessage(erro));
                } finally {
                    setSubmitting(false);
                    setProgresso(null);
                }
            }}
        >
            {({ isSubmitting, values }) => {
                const quantidade = Math.max(1, Number(values.quantidade) || 1);
                const valor = Number(values.valor) || 0;
                const porParcela = values.modo === 'DIVIDIR' ? valor / quantidade : valor;
                const total = values.modo === 'DIVIDIR' ? valor : valor * quantidade;

                return (
                    <Dialog
                        open
                        width={680}
                        title="Gerar boletos avulsos"
                        subtitle="Para um cliente sem contrato: um boleto ou várias parcelas de uma vez."
                        onClose={onClose}
                        footer={
                            <>
                                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                                <Button type="submit" form="boleto-avulso" loading={isSubmitting}>
                                    {progresso ? `Emitindo ${progresso.feitos}/${progresso.total}…` : values.emitir === 'true' ? (quantidade > 1 ? `Gerar ${quantidade} boletos` : 'Gerar boleto') : 'Criar contas a receber'}
                                </Button>
                            </>
                        }
                    >
                        <Form noValidate id="boleto-avulso">
                            <ParteField name="clienteId" parte="cliente" selecionadoInicial={cliente} hint="Digite o nome ou o CPF/CNPJ do cliente." />

                            <Grid $cols={2} style={{ marginTop: 12 }}>
                                <TextField name="descricao" label="Descrição" required placeholder="Ex.: Serviço de manutenção" />
                                <DateField name="dataVencimento" label="1º vencimento" required />
                                <TextField name="valor" label={values.modo === 'DIVIDIR' && quantidade > 1 ? 'Valor total (R$)' : 'Valor do boleto (R$)'} type="number" step="0.01" min="0" required />
                                <TextField name="quantidade" label="Quantidade de boletos" type="number" min="1" max="60" hint="1 = um boleto só; mais que 1 gera parcelas mensais." />
                                {quantidade > 1 && (
                                    <SelectField
                                        name="modo"
                                        label="Como usar o valor"
                                        placeholder={null}
                                        options={[
                                            { value: 'REPETIR', label: 'Valor de cada boleto (repete)' },
                                            { value: 'DIVIDIR', label: 'Valor total (divide entre as parcelas)' },
                                        ]}
                                    />
                                )}
                                <SelectField
                                    name="emitir"
                                    label="Emissão no Sicredi"
                                    placeholder={null}
                                    options={[
                                        { value: 'true', label: 'Emitir os boletos agora' },
                                        { value: 'false', label: 'Só criar as contas a receber' },
                                    ]}
                                />
                            </Grid>

                            {valor > 0 && quantidade > 1 && (
                                <p style={{ margin: '10px 0 0' }}>
                                    <Muted>
                                        {quantidade} boletos de {brl(porParcela)} (mensais) · total {brl(total)}
                                    </Muted>
                                </p>
                            )}

                            {values.emitir === 'true' && (
                                <div style={{ marginTop: 16 }}>
                                    <OpcoesBoletoCampos valores={values} />
                                </div>
                            )}
                        </Form>
                    </Dialog>
                );
            }}
        </Formik>
    );
}
