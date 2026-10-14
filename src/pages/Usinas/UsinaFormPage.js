import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as Yup from 'yup';
import { contratosApi, usinasApi } from '../../api/resources';
import ParteField from '../../components/ParteField';
import { SenhaAtual } from './AcessoPortal';
import { errorMessage, fieldErrors } from '../../api/client';
import {
    Button,
    Card,
    CardTitle,
    DateField,
    ErrorBlock,
    Grid,
    LoadingBlock,
    Page,
    PageHeader,
    Row,
    SelectField,
    TextField,
} from '../../ui';
import { inversorOptions, ufOptions } from '../../utils/enums';
import { toDateInput } from '../../utils/masks';

const positive = (label) => Yup.number().typeError('Informe um número.').moreThan(0, `${label} deve ser maior que zero.`).required('Campo obrigatório.');

const schema = (editing) => Yup.object({
    code: Yup.string().trim().required('Informe o código da usina.'),
    clientId: Yup.string().required('Selecione o cliente.'),
    local: Yup.string().trim().required('Informe o local da instalação.'),
    installationDate: Yup.string().required('Informe a data de instalação.'),
    inversor: Yup.string().required('Selecione a marca do inversor.'),
    inverterPot: positive('A potência do inversor'),
    panel: Yup.string().trim().required('Informe a marca/modelo do painel.'),
    panelPower: positive('A potência do painel'),
    numberPanel: Yup.number().typeError('Informe um número.').integer('Use um número inteiro.').moreThan(0, 'Informe ao menos 1 painel.').required('Campo obrigatório.'),
    estimatedGeneration: positive('A geração estimada'),
    login: Yup.string().trim().required('Informe o login do portal do fabricante.'),
    // Na edição, senha em branco mantém a atual.
    password: editing ? Yup.string() : Yup.string().required('Informe a senha do portal do fabricante.'),
});

function initialValues(usina, presetClienteId) {
    return {
        code: usina?.code ?? '',
        clientId: usina?.clientId ?? presetClienteId ?? '',
        contractId: usina?.contractId ?? '',
        local: usina?.local ?? '',
        cidade: usina?.cidade ?? '',
        uf: usina?.uf ?? '',
        installationDate: toDateInput(usina?.installationDate),
        inversor: usina?.inversor ?? '',
        inverterPot: usina?.inverterPot ?? '',
        panel: usina?.panel ?? '',
        panelPower: usina?.panelPower ?? '',
        numberPanel: usina?.numberPanel ?? '',
        estimatedGeneration: usina?.estimatedGeneration ?? '',
        login: usina?.login ?? '',
        password: '',
        ativa: usina?.ativa ?? true,
    };
}

// Cliente e contrato dependem um do outro; este bloco carrega as opções conforme a seleção.
function RelacoesFields({ values, setFieldValue, lockedCliente }) {
    const { data: contratos } = useQuery({
        queryKey: ['contratos', { clienteId: values.clientId }],
        queryFn: () => contratosApi.list({ clienteId: values.clientId, pageSize: 100 }),
        enabled: Boolean(values.clientId),
    });

    const contratoOptions = (contratos?.data ?? []).map((c) => ({
        value: c.id,
        label: `${new Date(c.dataContrato).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} · ${c.quantParcelas}x`,
    }));

    return (
        <Grid $cols={2}>
            <ParteField
                name="clientId"
                parte="cliente"
                required
                disabled={lockedCliente}
                hint="Digite o nome ou o CPF/CNPJ para filtrar a lista."
                onSelect={() => setFieldValue('contractId', '')}
            />
            <SelectField
                name="contractId"
                label="Contrato (opcional)"
                options={contratoOptions}
                placeholder={values.clientId ? 'Sem contrato vinculado' : 'Selecione o cliente primeiro'}
                disabled={!values.clientId}
            />
        </Grid>
    );
}

export default function UsinaFormPage() {
    const { id } = useParams();
    const editing = Boolean(id);
    const [searchParams] = useSearchParams();
    const presetClienteId = searchParams.get('clienteId') ?? '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: usina, isLoading, error, refetch } = useQuery({
        queryKey: ['usina', id],
        queryFn: () => usinasApi.get(id),
        enabled: editing,
    });

    const mutation = useMutation({
        mutationFn: (payload) => (editing ? usinasApi.update(id, payload) : usinasApi.create(payload)),
    });

    const handleSubmit = async (values, { setErrors }) => {
        const payload = {
            ...values,
            code: values.code.trim(),
            contractId: values.contractId || null,
            inverterPot: Number(values.inverterPot),
            panelPower: Number(values.panelPower),
            numberPanel: Number(values.numberPanel),
            estimatedGeneration: Number(values.estimatedGeneration),
        };

        if (editing && !payload.password) {
            delete payload.password;
        }

        try {
            const saved = await mutation.mutateAsync(payload);
            await queryClient.invalidateQueries({ queryKey: ['usinas'] });
            await queryClient.invalidateQueries({ queryKey: ['usina', saved.id] });
            toast.success(editing ? 'Usina atualizada.' : 'Usina cadastrada.');
            navigate(`/usinas/${saved.id}`);
        } catch (err) {
            setErrors(fieldErrors(err));
            toast.error(errorMessage(err));
        }
    };

    if (editing && isLoading) return <Page><LoadingBlock /></Page>;
    if (editing && error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    return (
        <Page>
            <PageHeader title={editing ? `Editar usina ${usina.code}` : 'Nova usina'} />

            <Formik
                initialValues={initialValues(usina, presetClienteId)}
                validationSchema={schema(editing)}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, isSubmitting }) => (
                    <Form noValidate>
                        <Card>
                            <CardTitle>Vínculo</CardTitle>
                            <RelacoesFields values={values} setFieldValue={setFieldValue} lockedCliente={Boolean(presetClienteId) && !editing} />
                        </Card>

                        <Card>
                            <CardTitle>Instalação</CardTitle>
                            <Grid $cols={3}>
                                <TextField name="code" label="Código da usina" required />
                                <DateField name="installationDate" label="Data de instalação" required />
                                <TextField name="estimatedGeneration" label="Geração estimada (kWh/mês)" type="number" step="0.01" required />
                            </Grid>
                            <Grid $cols={3} style={{ marginTop: 14 }}>
                                <div style={{ gridColumn: 'span 1' }}><TextField name="local" label="Local / endereço" required /></div>
                                <TextField name="cidade" label="Cidade" />
                                <SelectField name="uf" label="UF" options={ufOptions} />
                            </Grid>
                        </Card>

                        <Card>
                            <CardTitle>Equipamentos</CardTitle>
                            <Grid $cols={3}>
                                <SelectField name="inversor" label="Marca do inversor" required options={inversorOptions} />
                                <TextField name="inverterPot" label="Potência do inversor (kW)" type="number" step="0.01" required />
                                <span />
                                <TextField name="panel" label="Painel (marca/modelo)" required />
                                <TextField name="panelPower" label="Potência do painel (W)" type="number" step="1" required />
                                <TextField name="numberPanel" label="Quantidade de painéis" type="number" step="1" required />
                            </Grid>
                            <p style={{ marginTop: 10, color: 'var(--c-muted)', fontSize: '0.88rem' }}>
                                Potência instalada: <strong>{((Number(values.numberPanel) * Number(values.panelPower)) / 1000 || 0).toFixed(2)} kWp</strong> (calculada)
                            </p>
                        </Card>

                        <Card>
                            <CardTitle>Acesso ao portal do fabricante</CardTitle>
                            <Grid $cols={2}>
                                <TextField name="login" label="Login" required autoComplete="off" />
                                <TextField
                                    name="password"
                                    label="Senha"
                                    type="password"
                                    required={!editing}
                                    autoComplete="new-password"
                                    hint={editing ? 'Deixe em branco para manter a senha atual. A senha é armazenada criptografada.' : 'A senha é armazenada criptografada.'}
                                />
                            </Grid>
                            {editing && <SenhaAtual usinaId={id} />}
                        </Card>

                        <Row $justify="flex-end">
                            <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
                            <Button type="submit" loading={isSubmitting}>Salvar usina</Button>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Page>
    );
}
