import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, useFormikContext } from 'formik';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { muckApi } from '../../api/resources';
import ParteField from '../../components/ParteField';
import { Button, DateField, Dialog, Grid, Muted, Row, SelectField, TextField, TextareaField, tokens } from '../../ui';
import { hojeIso } from '../../utils/datas';
import { brl } from './format';

const { colors } = tokens;

const schema = Yup.object({
    veiculoId: Yup.string().required('Escolha o veículo'),
    clienteId: Yup.string().required('Escolha o cliente'),
    data: Yup.string().required('Informe a data'),
    destino: Yup.string().trim().required('Informe o local de destino'),
    descricao: Yup.string().trim().required('Descreva o serviço'),
    horas: Yup.number().typeError('Informe as horas').moreThan(0, 'As horas devem ser maiores que zero').required('Informe as horas trabalhadas'),
    valorHora: Yup.number().typeError('Informe o valor').min(0).nullable(),
    desconto: Yup.number().typeError('Informe o desconto').min(0).nullable(),
});

const dataInput = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : '');

/** Horas entre dois horários "HH:MM" do mesmo dia, com duas casas (ou null). */
export function horasEntre(inicio, fim) {
    const ok = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!ok.test(inicio || '') || !ok.test(fim || '')) return null;
    const minutos = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
    const dif = minutos(fim) - minutos(inicio);
    return dif > 0 ? Math.round((dif / 60) * 100) / 100 : null;
}

/** Preenche as horas quando os dois horários são informados e mostra o total do serviço. */
function Calculo({ veiculos }) {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const calculada = horasEntre(values.horaInicio, values.horaFim);
        if (calculada !== null && Number(values.horas) !== calculada) setFieldValue('horas', calculada);
    }, [values.horaInicio, values.horaFim]); // eslint-disable-line react-hooks/exhaustive-deps

    const veiculo = veiculos.find((v) => v.id === values.veiculoId);
    const valorHora = values.valorHora === '' ? Number(veiculo?.valorHora ?? 0) : Number(values.valorHora);
    const total = Math.max(0, Math.round(Number(values.horas || 0) * valorHora * 100) / 100 - Number(values.desconto || 0));

    return (
        <div style={{ padding: 12, borderRadius: 10, background: colors.background, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Muted>
                {Number(values.horas || 0).toLocaleString('pt-BR')} h × {brl(valorHora)}
                {Number(values.desconto) > 0 ? ` − ${brl(values.desconto)} de desconto` : ''}
            </Muted>
            <strong style={{ fontSize: '1.15rem' }}>{brl(total)}</strong>
        </div>
    );
}

function valoresIniciais(servico, veiculos) {
    const padrao = veiculos.find((v) => v.ativo) ?? veiculos[0];
    return {
        veiculoId: servico?.veiculo?.id ?? padrao?.id ?? '',
        clienteId: servico?.cliente?.id ?? '',
        motoristaId: servico?.motorista?.id ?? padrao?.motoristaPadrao?.id ?? '',
        data: servico ? dataInput(servico.data) : hojeIso(),
        destino: servico?.destino ?? '',
        descricao: servico?.descricao ?? '',
        horaInicio: servico?.horaInicio ?? '',
        horaFim: servico?.horaFim ?? '',
        horas: servico?.horas ?? '',
        valorHora: servico ? servico.valorHora : '',
        desconto: servico?.desconto || '',
        dataVencimento: servico ? dataInput(servico.dataVencimento) : '',
        emiteNota: servico?.emiteNota ?? false,
        observacoes: servico?.observacoes ?? '',
    };
}

/** Cadastro e edição de um serviço do munck. Ao salvar, a conta a receber é criada (ou atualizada) automaticamente. */
export default function ServicoDialog({ open, servico, onClose, onSaved }) {
    const queryClient = useQueryClient();
    const editando = Boolean(servico);
    const veiculos = useQuery({ queryKey: ['muck', 'veiculos'], queryFn: muckApi.veiculos, enabled: open });
    const motoristas = useQuery({ queryKey: ['muck', 'motoristas'], queryFn: muckApi.motoristas, enabled: open });

    const salvar = useMutation({
        mutationFn: (payload) => (editando ? muckApi.atualizarOperacao(servico.id, payload) : muckApi.criarOperacao(payload)),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(editando ? 'Serviço atualizado.' : 'Serviço registrado e lançado em contas a receber.');
            onSaved?.(resultado);
            onClose();
        },
    });

    if (!open) return null;
    if (veiculos.isLoading || motoristas.isLoading) return null;

    const listaVeiculos = veiculos.data ?? [];
    const veiculoOptions = listaVeiculos.filter((v) => v.ativo || v.id === servico?.veiculo?.id).map((v) => ({ value: v.id, label: v.placa ? `${v.nome} (${v.placa})` : v.nome }));
    const motoristaOptions = (motoristas.data ?? []).filter((m) => m.ativo || m.id === servico?.motorista?.id).map((m) => ({ value: m.id, label: m.nome }));

    const enviar = async (values, { setErrors }) => {
        const payload = {
            veiculoId: values.veiculoId,
            clienteId: values.clienteId,
            motoristaId: values.motoristaId || undefined,
            data: values.data,
            destino: values.destino.trim(),
            descricao: values.descricao.trim(),
            horaInicio: values.horaInicio || undefined,
            horaFim: values.horaFim || undefined,
            horas: Number(values.horas),
            valorHora: values.valorHora === '' ? undefined : Number(values.valorHora),
            desconto: values.desconto === '' ? 0 : Number(values.desconto),
            dataVencimento: values.dataVencimento || undefined,
            emiteNota: values.emiteNota,
            observacoes: values.observacoes || undefined,
        };

        try {
            await salvar.mutateAsync(payload);
        } catch (erro) {
            const campos = fieldErrors(erro);
            if (Object.keys(campos).length > 0) setErrors(campos);
            else toast.error(errorMessage(erro));
        }
    };

    return (
        <Formik initialValues={valoresIniciais(servico, listaVeiculos)} validationSchema={schema} onSubmit={enviar}>
            {({ values, isSubmitting }) => {
                const veiculo = listaVeiculos.find((v) => v.id === values.veiculoId);
                return (
                    <Dialog open={open} width={720} onClose={onClose} title={editando ? 'Editar serviço' : 'Novo serviço do munck'}>
                        <Form noValidate id="muck-servico-form">
                            <Grid $cols={2}>
                                <SelectField name="veiculoId" label="Veículo" options={veiculoOptions} required placeholder="Selecione" />
                                <DateField name="data" label="Data do serviço" required />
                            </Grid>
                            <ParteField
                                name="clienteId"
                                parte="cliente"
                                selecionadoInicial={servico?.cliente}
                                hint="Digite o nome ou o CPF/CNPJ do cliente. Para emitir nota, o cliente precisa ter CPF/CNPJ."
                                permitirCadastro
                                required
                            />
                            <Grid $cols={2}>
                                <TextField name="destino" label="Local de destino" required placeholder="Ex.: Usina em Pau dos Ferros" />
                                <SelectField name="motoristaId" label="Motorista" options={motoristaOptions} placeholder="Motorista padrão do veículo" />
                            </Grid>
                            <TextareaField name="descricao" label="Descrição do serviço" required rows={3} placeholder="O que foi feito (içamento de módulos, transporte de estrutura…)" />

                            <Grid $cols={3}>
                                <TextField name="horaInicio" label="Início" type="time" hint="Opcional" />
                                <TextField name="horaFim" label="Fim" type="time" hint="Opcional" />
                                <TextField name="horas" label="Horas trabalhadas" type="number" step="0.25" min="0" required hint="Preenchidas pelos horários, se informados" />
                            </Grid>
                            <Grid $cols={3}>
                                <TextField
                                    name="valorHora"
                                    label="Valor da hora (R$)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={veiculo ? String(veiculo.valorHora) : ''}
                                    hint={veiculo ? `Em branco usa o do veículo (${brl(veiculo.valorHora)})` : undefined}
                                />
                                <TextField name="desconto" label="Desconto (R$)" type="number" step="0.01" min="0" />
                                <DateField name="dataVencimento" label="Vencimento" hint={veiculo ? `Em branco: ${veiculo.prazoPagamentoDias} dias após o serviço` : undefined} />
                            </Grid>

                            <Calculo veiculos={listaVeiculos} />

                            <NotaCheckbox />
                            <TextareaField name="observacoes" label="Observações internas" rows={2} />
                        </Form>

                        <Row $justify="flex-end" style={{ marginTop: 20 }}>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="muck-servico-form" loading={isSubmitting || salvar.isPending}>Salvar</Button>
                        </Row>
                    </Dialog>
                );
            }}
        </Formik>
    );
}

function NotaCheckbox() {
    const { values, setFieldValue } = useFormikContext();
    return (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12, margin: '4px 0 12px' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                <input type="checkbox" checked={values.emiteNota} onChange={(e) => setFieldValue('emiteNota', e.target.checked)} />
                Este serviço terá nota fiscal (NFS-e)
            </label>
            <Muted style={{ display: 'block', marginTop: 4, fontSize: '0.85rem' }}>
                Nada é emitido ao salvar. Depois você confere o espelho de cada nota e confirma a emissão em Serviços.
            </Muted>
        </div>
    );
}
