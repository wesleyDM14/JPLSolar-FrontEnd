import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import ParteField from '../../components/ParteField';
import { errorMessage, fieldErrors } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Button, DateField, Dialog, Grid, Row, SelectField, TextField, TextareaField } from '../../ui';
import { hojeIso, TIPO } from './format';

const schema = Yup.object({
    descricao: Yup.string().trim().required('Informe a descrição'),
    valor: Yup.number().typeError('Informe o valor').moreThan(0, 'O valor deve ser maior que zero').required('Informe o valor'),
    dataVencimento: Yup.string().required('Informe o vencimento'),
    repetir: Yup.boolean(),
    quantidade: Yup.number().when('repetir', {
        is: true,
        then: (campo) => campo.typeError('Informe a quantidade').min(2, 'Mínimo 2').max(120, 'Máximo 120').required('Informe a quantidade'),
        otherwise: (campo) => campo.notRequired(),
    }),
});

const dateInput = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : '');

function initialValues(tipo, lancamento, preset) {
    return {
        descricao: lancamento?.descricao ?? '',
        valor: lancamento?.valor ?? '',
        dataVencimento: lancamento ? dateInput(lancamento.dataVencimento) : hojeIso(),
        categoriaId: lancamento?.categoria?.id ?? '',
        contaId: lancamento?.conta?.id ?? '',
        clienteId: lancamento?.cliente?.id ?? preset?.cliente?.id ?? '',
        fornecedorId: lancamento?.fornecedor?.id ?? '',
        numeroDocumento: lancamento?.numeroDocumento ?? '',
        observacoes: lancamento?.observacoes ?? '',
        repetir: false,
        modo: 'DIVIDIR',
        quantidade: 2,
        tipo,
    };
}

/** Escolha de cliente (a receber) ou fornecedor (a pagar), com busca por digitação. */
function ParteLancamento({ tipo, lancamento, preset }) {
    const receber = tipo === TIPO.RECEBER;
    const inicial = receber ? lancamento?.cliente ?? preset?.cliente : lancamento?.fornecedor;

    return (
        <ParteField
            name={receber ? 'clienteId' : 'fornecedorId'}
            parte={receber ? 'cliente' : 'fornecedor'}
            selecionadoInicial={inicial}
            hint={receber ? 'Digite o nome ou o CPF/CNPJ do cliente.' : 'Digite o nome do fornecedor.'}
        />
    );
}

export default function LancamentoFormDialog({ open, tipo, lancamento, preset, onClose, onSaved }) {
    const queryClient = useQueryClient();
    const editando = Boolean(lancamento);
    const tipoEfetivo = lancamento?.tipo ?? tipo;

    const categorias = useQuery({ queryKey: ['categorias', tipoEfetivo], queryFn: () => financeiroApi.categorias({ tipo: tipoEfetivo, ativos: 'true' }), enabled: open });
    const contas = useQuery({ queryKey: ['contas-financeiras'], queryFn: financeiroApi.contasFinanceiras, enabled: open });

    const salvar = useMutation({
        mutationFn: ({ id, payload }) => (id ? financeiroApi.updateLancamento(id, payload) : financeiroApi.createLancamento(payload)),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(editando ? 'Lançamento atualizado.' : Array.isArray(resultado) && resultado.length > 1 ? `${resultado.length} lançamentos criados.` : 'Lançamento criado.');
            onSaved?.(resultado);
            onClose();
        },
    });

    if (!open) return null;

    const categoriaOptions = (categorias.data ?? []).map((categoria) => ({ value: categoria.id, label: categoria.nome }));
    const contaOptions = (contas.data ?? []).filter((conta) => conta.ativa).map((conta) => ({ value: conta.id, label: conta.nome }));

    const enviar = async (values, { setErrors }) => {
        const comum = {
            descricao: values.descricao.trim(),
            valor: Number(values.valor),
            dataVencimento: values.dataVencimento,
            categoriaId: values.categoriaId || (editando ? null : undefined),
            contaId: values.contaId || (editando ? null : undefined),
            numeroDocumento: values.numeroDocumento || (editando ? null : undefined),
            observacoes: values.observacoes || (editando ? null : undefined),
        };
        const parte = tipoEfetivo === TIPO.RECEBER
            ? { clienteId: values.clienteId || (editando ? null : undefined) }
            : { fornecedorId: values.fornecedorId || (editando ? null : undefined) };

        try {
            if (editando) {
                await salvar.mutateAsync({ id: lancamento.id, payload: { ...comum, ...parte } });
            } else {
                const repeticao = values.repetir ? { quantidade: Number(values.quantidade), modo: values.modo } : undefined;
                await salvar.mutateAsync({ payload: { tipo: tipoEfetivo, ...comum, ...parte, repeticao } });
            }
        } catch (erro) {
            const campos = fieldErrors(erro);
            if (Object.keys(campos).length > 0) setErrors(campos);
            else toast.error(errorMessage(erro));
        }
    };

    return (
        <Formik initialValues={initialValues(tipoEfetivo, lancamento, preset)} validationSchema={schema} onSubmit={enviar}>
            {({ values, setFieldValue, isSubmitting }) => (
                <Dialog
                    open={open}
                    width={680}
                    onClose={onClose}
                    title={`${editando ? 'Editar' : 'Novo'} lançamento — ${tipoEfetivo === TIPO.RECEBER ? 'a receber' : 'a pagar'}`}
                >
                    <Form noValidate id="lancamento-form">
                        <TextField name="descricao" label="Descrição" required autoFocus />
                        <Grid $cols={2}>
                            <TextField name="valor" label={values.repetir && values.modo === 'DIVIDIR' ? 'Valor total (R$)' : 'Valor (R$)'} type="number" step="0.01" min="0" required />
                            <DateField name="dataVencimento" label={values.repetir ? 'Vencimento da 1ª parcela' : 'Vencimento'} required />
                        </Grid>
                        <Grid $cols={2}>
                            <SelectField name="categoriaId" label="Categoria" options={categoriaOptions} placeholder="Sem categoria" />
                            <SelectField
                                name="contaId"
                                label={tipoEfetivo === TIPO.RECEBER ? 'Conta de destino' : 'Conta de origem'}
                                options={contaOptions}
                                placeholder="Definir na baixa"
                            />
                        </Grid>
                        <ParteLancamento tipo={tipoEfetivo} lancamento={lancamento} preset={preset} />
                        <Grid $cols={2}>
                            <TextField name="numeroDocumento" label="Nº do documento (NF, boleto…)" />
                            <span />
                        </Grid>
                        <TextareaField name="observacoes" label="Observações" rows={2} />

                        {!editando && (
                            <div style={{ border: '1px solid var(--c-border)', borderRadius: 8, padding: 12, marginTop: 8 }}>
                                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                                    <input type="checkbox" checked={values.repetir} onChange={(event) => setFieldValue('repetir', event.target.checked)} />
                                    Parcelar ou repetir todo mês
                                </label>
                                {values.repetir && (
                                    <Grid $cols={2}>
                                        <SelectField
                                            name="modo"
                                            label="Como lançar"
                                            options={[
                                                { value: 'DIVIDIR', label: 'Dividir o valor em parcelas' },
                                                { value: 'REPETIR', label: 'Repetir o mesmo valor (recorrência)' },
                                            ]}
                                            placeholder="Selecione"
                                        />
                                        <TextField name="quantidade" label="Quantidade de meses" type="number" min="2" max="120" />
                                    </Grid>
                                )}
                            </div>
                        )}
                    </Form>

                    <Row $justify="flex-end" style={{ marginTop: 20 }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" form="lancamento-form" loading={isSubmitting || salvar.isPending}>Salvar</Button>
                    </Row>
                </Dialog>
            )}
        </Formik>
    );
}
