import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as Yup from 'yup';
import { clientesApi, contratosApi } from '../../api/resources';
import { errorMessage, fieldErrors } from '../../api/client';
import ParteField from '../../components/ParteField';
import {
    Badge,
    Button,
    Card,
    CardTitle,
    DateField,
    EnderecoFields,
    emptyEndereco,
    enderecoPayload,
    enderecoSchema,
    ErrorBlock,
    Grid,
    KeyValue,
    LoadingBlock,
    Page,
    PageHeader,
    Row,
    SelectField,
    TextareaField,
    TextField,
} from '../../ui';
import { hojeIso } from '../../utils/datas';
import { TIPO_CONTRATO, tipoContratoLabel, tipoContratoOptions, tipoPessoaLabel } from '../../utils/enums';
import { pendenciasParaContrato } from '../../utils/contratoPendencias';
import { formatCurrency, formatDocumento, onlyDigits, toDateInput } from '../../utils/masks';
import { isValidCpf } from '../../utils/validators';

const positive = (label) => Yup.number().typeError('Informe um número.').moreThan(0, `${label} deve ser maior que zero.`).required('Campo obrigatório.');

// Os dois tipos de prestação de serviços compartilham pagamento à vista/parcelado e não têm carência nem avalista.
const isServicos = (tipo) => tipo === TIPO_CONTRATO.PRESTACAO_SERVICOS || tipo === TIPO_CONTRATO.SERVICO_GERAL;
const isInstalacao = (tipo) => tipo === TIPO_CONTRATO.PRESTACAO_SERVICOS;
const isGeral = (tipo) => tipo === TIPO_CONTRATO.SERVICO_GERAL;

const validationSchema = (editing) => Yup.object({
    tipo: Yup.string().required(),
    clienteId: editing ? Yup.string() : Yup.string().required('Selecione o cliente.'),
    dataContrato: Yup.string().required('Informe a data do contrato.'),
    priceTotal: positive('O valor total'),
    // Sistema fotovoltaico: não se aplica ao serviço geral.
    modeloModulos: Yup.string().when('tipo', { is: isGeral, then: () => Yup.string(), otherwise: () => Yup.string().trim().required('Informe o modelo dos módulos.') }),
    potModulos: Yup.number().when('tipo', { is: isGeral, then: () => Yup.number().nullable(), otherwise: () => positive('A potência dos módulos') }),
    modeloInversor: Yup.string().when('tipo', { is: isGeral, then: () => Yup.string(), otherwise: () => Yup.string().trim().required('Informe o modelo do inversor.') }),
    potInversor: Yup.number().when('tipo', { is: isGeral, then: () => Yup.number().nullable(), otherwise: () => positive('A potência do inversor') }),

    // Serviço geral
    objeto: Yup.string().when('tipo', { is: isGeral, then: () => Yup.string().trim().required('Informe o objeto do contrato.').max(190, 'Use até 190 caracteres.'), otherwise: () => Yup.string() }),
    escopo: Yup.string().when('tipo', { is: isGeral, then: () => Yup.string().trim().required('Descreva os serviços.'), otherwise: () => Yup.string() }),

    // Compra e venda financiada
    carencia: Yup.number().typeError('Informe um número.').min(0, 'Não pode ser negativa.').integer('Use dias inteiros.'),
    quantParcelas: Yup.number().typeError('Informe um número.').integer('Use um número inteiro.').min(1, 'Mínimo 1.').max(240, 'Máximo 240 parcelas.').required('Campo obrigatório.'),
    dataPrimeiraParcela: Yup.string().when(['tipo', 'pagamento'], {
        is: (tipo, pagamento) => !isServicos(tipo) || pagamento === 'PARCELADO',
        then: () => Yup.string().required('Informe o vencimento da primeira parcela.')
            .test('apos-contrato', 'A primeira parcela não pode vencer antes da data do contrato.', function check(value) {
                return !value || !this.parent.dataContrato || value >= this.parent.dataContrato;
            }),
        otherwise: () => Yup.string(),
    }),
    priceParcela: Yup.number().when(['tipo', 'pagamento'], {
        is: (tipo, pagamento) => !isServicos(tipo) || pagamento === 'PARCELADO',
        then: () => positive('O valor da parcela'),
        otherwise: () => Yup.number().nullable(),
    }),

    // Prestação de serviços
    quantModulos: Yup.number().when('tipo', {
        is: isInstalacao,
        then: () => Yup.number().typeError('Informe um número.').integer('Use um número inteiro.').moreThan(0, 'Informe ao menos 1 módulo.').required('Campo obrigatório.'),
        otherwise: () => Yup.number().nullable(),
    }),
    estimativaGeracaoMensal: Yup.number().when('tipo', {
        is: isInstalacao,
        then: () => positive('A estimativa de geração'),
        otherwise: () => Yup.number().nullable(),
    }),

    endereco: Yup.object().when('usarEnderecoCliente', {
        is: true,
        then: () => Yup.object(),
        otherwise: () => enderecoSchema(true),
    }),
    avalista: Yup.object().when('incluirAvalista', {
        is: true,
        then: () => Yup.object({
            nome: Yup.string().trim().required('Informe o nome do avalista.'),
            profissao: Yup.string().trim().required('Informe a profissão do avalista.'),
            cpf: Yup.string().required('Informe o CPF do avalista.').test('cpf', 'CPF inválido.', (v) => isValidCpf(v)),
            endereco: enderecoSchema(true),
        }),
        otherwise: () => Yup.object(),
    }),
});

function initialValues(contrato, presetClienteId) {
    const avalista = contrato?.avalista;
    const servicos = isServicos(contrato?.tipo);

    return {
        tipo: contrato?.tipo ?? TIPO_CONTRATO.COMPRA_VENDA,
        clienteId: contrato?.clienteId ?? presetClienteId ?? '',
        dataContrato: toDateInput(contrato?.dataContrato) || hojeIso(),
        carencia: contrato?.carencia ?? 0,
        dataPrimeiraParcela: toDateInput(contrato?.dataPrimeiraParcela),
        quantParcelas: contrato?.quantParcelas ?? (servicos ? 1 : ''),
        priceTotal: contrato?.priceTotal ?? '',
        priceParcela: contrato?.priceParcela ?? '',
        // Prestação de serviços: à vista na assinatura ou parcelado.
        pagamento: servicos && contrato.quantParcelas > 1 ? 'PARCELADO' : 'A_VISTA',
        modeloModulos: contrato?.modeloModulos ?? '',
        potModulos: contrato?.potModulos ?? '',
        modeloInversor: contrato?.modeloInversor ?? '',
        potInversor: contrato?.potInversor ?? '',
        quantModulos: contrato?.quantModulos ?? '',
        estimativaGeracaoMensal: contrato?.estimativaGeracaoMensal ?? '',
        objeto: contrato?.objeto ?? '',
        escopo: contrato?.escopo ?? '',
        prazoExecucao: contrato?.prazoExecucao ?? '',
        garantia: contrato?.garantia ?? '',
        clausulasAdicionais: contrato?.clausulasAdicionais ?? '',
        // Em edição o endereço do contrato é próprio; na criação o padrão é o do cliente.
        usarEnderecoCliente: !contrato,
        endereco: contrato?.endereco ? { ...emptyEndereco, ...contrato.endereco, complemento: contrato.endereco.complemento ?? '' } : emptyEndereco,
        incluirAvalista: Boolean(avalista),
        avalista: {
            nome: avalista?.nome ?? '',
            profissao: avalista?.profissao ?? '',
            cpf: avalista?.cpf ?? '',
            endereco: avalista?.endereco ? { ...emptyEndereco, ...avalista.endereco, complemento: avalista.endereco.complemento ?? '' } : emptyEndereco,
        },
    };
}

function buildPayload(values, editing) {
    const servicos = isServicos(values.tipo);
    const parcelado = !servicos || values.pagamento === 'PARCELADO';

    const geral = isGeral(values.tipo);

    const payload = {
        dataContrato: values.dataContrato,
        priceTotal: Number(values.priceTotal),
        ...(geral
            ? {
                objeto: values.objeto.trim(),
                escopo: values.escopo.trim(),
                prazoExecucao: values.prazoExecucao.trim(),
                garantia: values.garantia.trim(),
                clausulasAdicionais: values.clausulasAdicionais.trim(),
            }
            : {
                modeloModulos: values.modeloModulos.trim(),
                potModulos: Number(values.potModulos),
                modeloInversor: values.modeloInversor.trim(),
                potInversor: Number(values.potInversor),
            }),
    };

    if (!editing) {
        payload.tipo = values.tipo;
        payload.clienteId = values.clienteId;
    }

    if (servicos) {
        if (isInstalacao(values.tipo)) {
            payload.quantModulos = Number(values.quantModulos);
            payload.estimativaGeracaoMensal = Number(values.estimativaGeracaoMensal);
        }
        payload.quantParcelas = parcelado ? Number(values.quantParcelas) : 1;

        if (parcelado) {
            payload.dataPrimeiraParcela = values.dataPrimeiraParcela;
            payload.priceParcela = Number(values.priceParcela);
        }
    } else {
        payload.carencia = Number(values.carencia);
        payload.dataPrimeiraParcela = values.dataPrimeiraParcela;
        payload.quantParcelas = Number(values.quantParcelas);
        payload.priceParcela = Number(values.priceParcela);

        if (values.incluirAvalista) {
            payload.avalista = {
                nome: values.avalista.nome.trim(),
                profissao: values.avalista.profissao.trim(),
                cpf: onlyDigits(values.avalista.cpf),
                endereco: enderecoPayload(values.avalista.endereco),
            };
        } else if (editing) {
            payload.avalista = null; // remove avalista existente
        }
    }

    if (!values.usarEnderecoCliente) payload.endereco = enderecoPayload(values.endereco);

    return payload;
}

function ClienteSelector({ values, locked }) {
    const { data: cliente } = useQuery({
        queryKey: ['cliente', values.clienteId],
        queryFn: () => clientesApi.get(values.clienteId),
        enabled: Boolean(values.clienteId),
    });

    const pendencias = pendenciasParaContrato(cliente, { exigirEndereco: values.usarEnderecoCliente, tipoContrato: values.tipo });

    return (
        <Card>
            <CardTitle>Cliente</CardTitle>
            <Grid $cols={2}>
                <ParteField name="clienteId" parte="cliente" required disabled={locked} selecionadoInicial={cliente} hint="Digite o nome ou o CPF/CNPJ para filtrar a lista." />
                <div style={{ alignSelf: 'end', paddingBottom: 6 }}>
                    <Link to="/clientes/novo">Cadastrar novo cliente</Link>
                </div>
            </Grid>

            {cliente && (
                <div style={{ marginTop: 16 }}>
                    <Grid $cols={3}>
                        <KeyValue label="Tipo">{tipoPessoaLabel(cliente.tipoPessoa)}</KeyValue>
                        <KeyValue label="Documento">{cliente.documento ? formatDocumento(cliente.documento) : ''}</KeyValue>
                        <KeyValue label="Endereço cadastrado">{cliente.endereco ? `${cliente.endereco.cidade}/${cliente.endereco.uf}` : ''}</KeyValue>
                    </Grid>

                    {pendencias.length > 0 ? (
                        <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'var(--c-warning-bg)', color: 'var(--c-warning)' }}>
                            <strong>Cadastro incompleto para este contrato.</strong> Falta: {pendencias.join(', ')}.{' '}
                            <Link to={`/clientes/${cliente.id}/editar`}>Completar cadastro</Link>
                        </div>
                    ) : (
                        <div style={{ marginTop: 14 }}><Badge $tone="success">Cadastro pronto para contrato</Badge></div>
                    )}
                </div>
            )}
        </Card>
    );
}

function CondicoesFinanceiras({ values, setFieldValue }) {
    const servicos = isServicos(values.tipo);
    const parcelado = !servicos || values.pagamento === 'PARCELADO';

    return (
        <Card>
            <CardTitle>{servicos ? 'Preço e pagamento' : 'Condições financeiras'}</CardTitle>
            <Grid $cols={3}>
                <DateField name="dataContrato" label="Data do contrato" required />
                <TextField name="priceTotal" label="Valor total (R$)" type="number" step="0.01" required />
                {servicos ? (
                    <SelectField
                        name="pagamento"
                        label="Forma de pagamento"
                        options={[{ value: 'A_VISTA', label: 'À vista, na assinatura' }, { value: 'PARCELADO', label: 'Parcelado' }]}
                        placeholder="Selecione"
                        onChange={(event) => {
                            setFieldValue('pagamento', event.target.value);
                            if (event.target.value === 'A_VISTA') setFieldValue('quantParcelas', 1);
                        }}
                    />
                ) : (
                    <TextField name="carencia" label="Carência (dias)" type="number" step="1" />
                )}
            </Grid>

            {parcelado && (
                <>
                    <Grid $cols={3} style={{ marginTop: 14 }}>
                        <TextField name="quantParcelas" label="Quantidade de parcelas" type="number" step="1" required />
                        <TextField name="priceParcela" label="Valor da parcela (R$)" type="number" step="0.01" required />
                        <DateField name="dataPrimeiraParcela" label="Vencimento da 1ª parcela" required />
                    </Grid>
                    <Row style={{ marginTop: 10 }}>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={!Number(values.priceTotal) || !Number(values.quantParcelas)}
                            onClick={() => setFieldValue('priceParcela', Math.round((Number(values.priceTotal) / Number(values.quantParcelas)) * 100) / 100)}
                        >
                            Calcular parcela (total ÷ parcelas)
                        </Button>
                        {Number(values.priceParcela) > 0 && Number(values.quantParcelas) > 0 && (
                            <span style={{ color: 'var(--c-muted)', fontSize: '0.88rem' }}>
                                Total das parcelas: {formatCurrency(Number(values.priceParcela) * Number(values.quantParcelas))}
                            </span>
                        )}
                    </Row>
                </>
            )}
        </Card>
    );
}

export default function ContratoFormPage() {
    const { id } = useParams();
    const editing = Boolean(id);
    const [searchParams] = useSearchParams();
    const presetClienteId = searchParams.get('clienteId') ?? '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: contrato, isLoading, error, refetch } = useQuery({
        queryKey: ['contrato', id],
        queryFn: () => contratosApi.get(id),
        enabled: editing,
    });

    const mutation = useMutation({
        mutationFn: (payload) => (editing ? contratosApi.update(id, payload) : contratosApi.create(payload)),
    });

    const handleSubmit = async (values, { setErrors }) => {
        try {
            const saved = await mutation.mutateAsync(buildPayload(values, editing));
            await queryClient.invalidateQueries({ queryKey: ['contratos'] });
            await queryClient.invalidateQueries({ queryKey: ['contrato', saved.id] });
            toast.success(editing ? 'Contrato atualizado.' : 'Contrato criado.');
            navigate(`/contratos/${saved.id}`);
        } catch (err) {
            setErrors(fieldErrors(err));
            toast.error(errorMessage(err));
        }
    };

    if (editing && isLoading) return <Page><LoadingBlock /></Page>;
    if (editing && error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    return (
        <Page>
            <PageHeader
                title={editing ? 'Editar contrato' : 'Novo contrato'}
                subtitle={editing ? `${contrato.cliente.nome} · ${tipoContratoLabel(contrato.tipo)}` : 'Escolha o tipo, o cliente e as condições.'}
            />

            <Formik
                initialValues={initialValues(contrato, presetClienteId)}
                validationSchema={validationSchema(editing)}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, isSubmitting }) => {
                    const servicos = isServicos(values.tipo);
                    const geral = isGeral(values.tipo);

                    return (
                        <Form noValidate>
                            {!editing && (
                                <Card>
                                    <CardTitle>Tipo de contrato</CardTitle>
                                    <Grid $cols={3}>
                                        {tipoContratoOptions.map((option) => (
                                            <label
                                                key={option.value}
                                                style={{
                                                    display: 'flex',
                                                    gap: 10,
                                                    alignItems: 'flex-start',
                                                    padding: 14,
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    border: `2px solid ${values.tipo === option.value ? 'var(--c-primary)' : 'var(--c-border)'}`,
                                                    background: values.tipo === option.value ? 'var(--c-danger-bg)' : 'var(--c-surface)',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tipo"
                                                    value={option.value}
                                                    checked={values.tipo === option.value}
                                                    onChange={() => {
                                                        setFieldValue('tipo', option.value);
                                                        setFieldValue('quantParcelas', option.value === TIPO_CONTRATO.COMPRA_VENDA ? '' : 1);
                                                        setFieldValue('pagamento', 'A_VISTA');
                                                    }}
                                                />
                                                <span>
                                                    <strong>{option.label}</strong>
                                                    <br />
                                                    <span style={{ color: 'var(--c-muted)', fontSize: '0.88rem' }}>
                                                        {{
                                                            COMPRA_VENDA: 'Venda parcelada com alienação fiduciária, promissória e avalista opcional.',
                                                            PRESTACAO_SERVICOS: 'Venda de usina completa ou instalação para o cliente: equipamentos, geração estimada, garantias e pagamento.',
                                                            SERVICO_GERAL: 'Qualquer outro serviço (manutenção, projeto, obra, consultoria…): você descreve o objeto, o escopo e as condições.',
                                                        }[option.value]}
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </Grid>
                                </Card>
                            )}

                            {editing ? (
                                <Card>
                                    <CardTitle>Cliente</CardTitle>
                                    <Link to={`/clientes/${contrato.clienteId}`}>{contrato.cliente.nome}</Link>
                                </Card>
                            ) : (
                                <ClienteSelector values={values} locked={Boolean(presetClienteId)} />
                            )}

                            {geral && (
                                <Card>
                                    <CardTitle>Serviço contratado</CardTitle>
                                    <TextField name="objeto" label="Objeto do contrato" required placeholder="Ex.: Manutenção preventiva do sistema fotovoltaico" hint="Título curto do que será feito." />
                                    <TextareaField
                                        name="escopo"
                                        label="Descrição dos serviços"
                                        required
                                        rows={6}
                                        hint="Um item por linha. Cada linha vira um item numerado na cláusula do objeto."
                                        placeholder={'Limpeza e inspeção dos módulos\nVerificação de conexões e inversor\nRelatório técnico ao final'}
                                    />
                                    <Grid $cols={2}>
                                        <TextField name="prazoExecucao" label="Prazo de execução" placeholder="Ex.: 15 dias corridos a partir da assinatura" />
                                        <span />
                                    </Grid>
                                    <TextareaField name="garantia" label="Garantia (opcional)" rows={3} hint="Um item por linha. Sem texto, entra a garantia legal padrão." />
                                    <TextareaField name="clausulasAdicionais" label="Condições adicionais (opcional)" rows={4} hint="Um item por linha: visitas, deslocamento, materiais, responsabilidades específicas…" />
                                </Card>
                            )}

                            {!geral && (
                            <Card>
                                <CardTitle>Sistema fotovoltaico</CardTitle>
                                <Grid $cols={2}>
                                    <TextField name="modeloModulos" label="Modelo dos módulos" required />
                                    <TextField name="potModulos" label={servicos ? 'Potência total (kWp)' : 'Potência dos módulos (kWp)'} type="number" step="0.01" required />
                                    <TextField name="modeloInversor" label="Modelo do inversor" required />
                                    <TextField name="potInversor" label="Potência do inversor (kW)" type="number" step="0.01" required />
                                    {isInstalacao(values.tipo) && (
                                        <>
                                            <TextField name="quantModulos" label="Quantidade de módulos" type="number" step="1" required />
                                            <TextField
                                                name="estimativaGeracaoMensal"
                                                label="Estimativa de geração (kWh/mês)"
                                                type="number"
                                                step="0.01"
                                                required
                                                hint="Média mensal; o contrato calcula a média diária (÷ 30)."
                                            />
                                        </>
                                    )}
                                </Grid>
                            </Card>
                            )}

                            <CondicoesFinanceiras values={values} setFieldValue={setFieldValue} />

                            <Card>
                                <CardTitle>{geral ? 'Local de execução dos serviços' : 'Local da instalação'}</CardTitle>
                                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={values.usarEnderecoCliente}
                                        onChange={(event) => setFieldValue('usarEnderecoCliente', event.target.checked)}
                                    />
                                    Usar o endereço cadastrado do cliente
                                </label>
                                {!values.usarEnderecoCliente && <EnderecoFields name="endereco" required />}
                            </Card>

                            {!servicos && (
                                <Card>
                                    <CardTitle>Avalista</CardTitle>
                                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                                        <input
                                            type="checkbox"
                                            checked={values.incluirAvalista}
                                            onChange={(event) => setFieldValue('incluirAvalista', event.target.checked)}
                                        />
                                        Incluir avalista
                                    </label>
                                    {values.incluirAvalista && (
                                        <>
                                            <Grid $cols={3}>
                                                <TextField name="avalista.nome" label="Nome completo" required />
                                                <TextField name="avalista.cpf" label="CPF" mask="cpf" required placeholder="000.000.000-00" />
                                                <TextField name="avalista.profissao" label="Profissão" required />
                                            </Grid>
                                            <div style={{ marginTop: 14 }}>
                                                <EnderecoFields name="avalista.endereco" required />
                                            </div>
                                        </>
                                    )}
                                </Card>
                            )}

                            <Row $justify="flex-end">
                                <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
                                <Button type="submit" loading={isSubmitting}>{editing ? 'Salvar alterações' : 'Criar contrato'}</Button>
                            </Row>
                        </Form>
                    );
                }}
            </Formik>
        </Page>
    );
}
