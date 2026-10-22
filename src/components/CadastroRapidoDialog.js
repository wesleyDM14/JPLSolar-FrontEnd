import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../api/client';
import { clientesApi, financeiroApi } from '../api/resources';
import { Button, Dialog, Grid, SelectField, TextField } from '../ui';
import { TIPO_PESSOA, tipoPessoaOptions } from '../utils/enums';
import { onlyDigits } from '../utils/masks';

const ROTULOS = {
    cliente: { titulo: 'Novo cliente', subtitulo: 'Só o nome é obrigatório. Os demais dados você completa depois, no cadastro do cliente.', nome: 'Nome ou razão social' },
    fornecedor: { titulo: 'Novo fornecedor', subtitulo: 'Só o nome é obrigatório. Você pode completar o cadastro depois.', nome: 'Nome do fornecedor' },
};

const schema = Yup.object({
    nome: Yup.string().trim().required('Informe o nome'),
    email: Yup.string().trim().email('E-mail inválido'),
});

/**
 * Cadastro rápido de cliente ou fornecedor sem sair da tela (por exemplo, no meio de uma conta a pagar ou a receber):
 * a janela abre por cima do formulário, que mantém tudo o que já foi preenchido. Ao salvar devolve o registro criado.
 */
export default function CadastroRapidoDialog({ open, parte = 'cliente', nomeInicial = '', onClose, onCriado }) {
    const queryClient = useQueryClient();
    const rotulos = ROTULOS[parte];
    const cliente = parte === 'cliente';
    const idDoFormulario = `cadastro-rapido-${parte}`;

    const salvar = useMutation({
        mutationFn: (values) => {
            const comum = {
                nome: values.nome.trim(),
                documento: onlyDigits(values.documento),
                telefone: onlyDigits(values.telefone),
                email: values.email.trim(),
            };
            return cliente ? clientesApi.create({ tipoPessoa: values.tipoPessoa, ...comum }) : financeiroApi.createFornecedor(comum);
        },
    });

    return (
        <Dialog
            open={open}
            title={rotulos.titulo}
            subtitle={rotulos.subtitulo}
            width={480}
            onClose={salvar.isPending ? undefined : onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={salvar.isPending}>Cancelar</Button>
                    <Button type="submit" form={idDoFormulario} loading={salvar.isPending}>Cadastrar e usar</Button>
                </>
            }
        >
            <Formik
                enableReinitialize
                initialValues={{ tipoPessoa: TIPO_PESSOA.PESSOA_FISICA, nome: nomeInicial, documento: '', telefone: '', email: '' }}
                validationSchema={schema}
                onSubmit={async (values, { setErrors }) => {
                    try {
                        const criado = await salvar.mutateAsync(values);
                        await queryClient.invalidateQueries({ queryKey: [cliente ? 'clientes' : 'fornecedores'] });
                        await queryClient.invalidateQueries({ queryKey: ['combobox'] });
                        toast.success(cliente ? 'Cliente cadastrado.' : 'Fornecedor cadastrado.');
                        onCriado(criado);
                    } catch (erro) {
                        setErrors(fieldErrors(erro));
                        toast.error(errorMessage(erro));
                    }
                }}
            >
                {({ values }) => (
                    // O submit não sobe para o formulário de baixo (o Formik interrompe a propagação), então a conta em edição não é enviada.
                    <Form id={idDoFormulario} noValidate>
                        <Grid $cols={2}>
                            {cliente && <SelectField name="tipoPessoa" label="Tipo de pessoa" options={tipoPessoaOptions} placeholder={null} />}
                            <TextField
                                name="documento"
                                label={cliente ? (values.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA ? 'CPF' : 'CNPJ') : 'CPF ou CNPJ'}
                                mask={cliente ? (values.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA ? 'cpf' : 'cnpj') : 'documento'}
                                placeholder="Opcional"
                            />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <TextField name="nome" label={rotulos.nome} required autoFocus />
                            </div>
                            <TextField name="telefone" label="Telefone" mask="phone" placeholder="Opcional" />
                            <TextField name="email" label="E-mail" type="email" placeholder="Opcional" />
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}
