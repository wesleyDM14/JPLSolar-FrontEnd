import { Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import {
    Button,
    Card,
    CardTitle,
    DateField,
    EnderecoFields,
    emptyEndereco,
    enderecoPayload,
    enderecoSchema,
    Grid,
    isEnderecoEmpty,
    Row,
    SelectField,
    TextareaField,
    TextField,
} from '../../ui';
import { estadoCivilOptions, generoOptions, TIPO_PESSOA, tipoPessoaOptions } from '../../utils/enums';
import { onlyDigits } from '../../utils/masks';
import { toDateInput } from '../../utils/masks';
import { isValidCnpj, isValidCpf } from '../../utils/validators';

export function clienteInitialValues(cliente) {
    return {
        tipoPessoa: cliente?.tipoPessoa ?? TIPO_PESSOA.PESSOA_FISICA,
        nome: cliente?.nome ?? '',
        nomeFantasia: cliente?.nomeFantasia ?? '',
        documento: cliente?.documento ?? '',
        email: cliente?.email ?? '',
        telefone: cliente?.telefone ?? '',
        rg: cliente?.rg ?? '',
        dataNascimento: toDateInput(cliente?.dataNascimento),
        estadoCivil: cliente?.estadoCivil ?? '',
        genero: cliente?.genero ?? '',
        profissao: cliente?.profissao ?? '',
        inscricaoEstadual: cliente?.inscricaoEstadual ?? '',
        representanteNome: cliente?.representanteNome ?? '',
        representanteCpf: cliente?.representanteCpf ?? '',
        representanteCargo: cliente?.representanteCargo ?? '',
        observacoes: cliente?.observacoes ?? '',
        endereco: cliente?.endereco ? { ...emptyEndereco, ...cliente.endereco, complemento: cliente.endereco.complemento ?? '' } : emptyEndereco,
    };
}

const validationSchema = Yup.object({
    tipoPessoa: Yup.string().required(),
    nome: Yup.string().trim().required('Informe o nome.'),
    documento: Yup.string().test('documento', function validateDocumento(value) {
        if (!value) return true;
        const isPf = this.parent.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA;
        return (isPf ? isValidCpf(value) : isValidCnpj(value)) || this.createError({ message: isPf ? 'CPF inválido.' : 'CNPJ inválido.' });
    }),
    email: Yup.string().trim().email('E-mail inválido.'),
    telefone: Yup.string().test('telefone', 'Telefone deve ter DDD + 8 ou 9 dígitos.', (value) => {
        const digits = onlyDigits(value);
        return !digits || digits.length === 10 || digits.length === 11;
    }),
    representanteCpf: Yup.string().test('cpf', 'CPF inválido.', (value) => !value || isValidCpf(value)),
    endereco: enderecoSchema(false),
});

// Endereço é "tudo ou nada": se começou a preencher, os campos principais passam a ser obrigatórios.
function validateEndereco(values) {
    if (isEnderecoEmpty(values.endereco)) return {};

    const required = { cep: 'Informe o CEP.', logradouro: 'Informe o logradouro.', numero: 'Informe o número.', bairro: 'Informe o bairro.', cidade: 'Informe a cidade.', uf: 'Informe a UF.' };
    const errors = {};

    Object.entries(required).forEach(([field, message]) => {
        if (!String(values.endereco[field] ?? '').trim()) {
            errors[field] = message;
        }
    });

    return Object.keys(errors).length ? { endereco: errors } : {};
}

export function buildClientePayload(values) {
    const pessoaFisica = values.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA;

    return {
        tipoPessoa: values.tipoPessoa,
        nome: values.nome.trim(),
        documento: onlyDigits(values.documento),
        email: values.email.trim(),
        telefone: onlyDigits(values.telefone),
        observacoes: values.observacoes,
        ...(pessoaFisica
            ? {
                rg: values.rg,
                dataNascimento: values.dataNascimento,
                estadoCivil: values.estadoCivil,
                genero: values.genero,
                profissao: values.profissao,
            }
            : {
                nomeFantasia: values.nomeFantasia,
                inscricaoEstadual: values.inscricaoEstadual,
                representanteNome: values.representanteNome,
                representanteCpf: onlyDigits(values.representanteCpf),
                representanteCargo: values.representanteCargo,
            }),
        ...(isEnderecoEmpty(values.endereco) ? {} : { endereco: enderecoPayload(values.endereco) }),
    };
}

function Fields() {
    const { values, isSubmitting } = useFormikContext();
    const pessoaFisica = values.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA;

    return (
        <>
            <Card>
                <CardTitle>Identificação</CardTitle>
                <Grid $cols={2}>
                    <SelectField name="tipoPessoa" label="Tipo de pessoa" required options={tipoPessoaOptions} placeholder="Selecione" />
                    <TextField
                        name="documento"
                        label={pessoaFisica ? 'CPF' : 'CNPJ'}
                        mask={pessoaFisica ? 'cpf' : 'cnpj'}
                        hint="Obrigatório para emitir contrato."
                        placeholder={pessoaFisica ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                </Grid>
                <Grid $cols={2} style={{ marginTop: 14 }}>
                    <TextField name="nome" label={pessoaFisica ? 'Nome completo' : 'Razão social'} required />
                    {!pessoaFisica && <TextField name="nomeFantasia" label="Nome fantasia" />}
                </Grid>
                <Grid $cols={2} style={{ marginTop: 14 }}>
                    <TextField name="email" label="E-mail" type="email" />
                    <TextField name="telefone" label="Telefone / WhatsApp" mask="phone" placeholder="(00) 00000-0000" />
                </Grid>
            </Card>

            {pessoaFisica ? (
                <Card>
                    <CardTitle>Dados pessoais</CardTitle>
                    <Grid $cols={3}>
                        <TextField name="rg" label="RG" />
                        <DateField name="dataNascimento" label="Data de nascimento" />
                        <TextField name="profissao" label="Profissão" />
                    </Grid>
                    <Grid $cols={2} style={{ marginTop: 14 }}>
                        <SelectField name="estadoCivil" label="Estado civil" options={estadoCivilOptions} />
                        <SelectField name="genero" label="Gênero" options={generoOptions} />
                    </Grid>
                </Card>
            ) : (
                <Card>
                    <CardTitle>Empresa e representante legal</CardTitle>
                    <Grid $cols={2}>
                        <TextField name="inscricaoEstadual" label="Inscrição estadual" />
                        <span />
                        <TextField name="representanteNome" label="Nome do representante legal" />
                        <TextField name="representanteCpf" label="CPF do representante" mask="cpf" placeholder="000.000.000-00" />
                        <TextField name="representanteCargo" label="Cargo do representante" placeholder="Ex.: Sócio-administrador" />
                    </Grid>
                </Card>
            )}

            <Card>
                <CardTitle>Endereço</CardTitle>
                <EnderecoFields name="endereco" />
            </Card>

            <Card>
                <CardTitle>Observações</CardTitle>
                <TextareaField name="observacoes" label="Anotações internas" />
            </Card>

            <Row $justify="flex-end">
                <Button type="submit" loading={isSubmitting}>Salvar cliente</Button>
            </Row>
        </>
    );
}

export function ClienteForm({ initialValues, onSubmit }) {
    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            validate={validateEndereco}
            onSubmit={onSubmit}
            enableReinitialize
        >
            <Form noValidate>
                <Fields />
            </Form>
        </Formik>
    );
}
