import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { bancosApi, financeiroApi, sicrediApi } from '../../api/resources';
import { dataHoraBr } from '../../utils/datas';
import HomologacaoDialog from './boleto/HomologacaoDialog';
import { Badge, Button, Card, CardTitle, ConfirmDialog, ErrorBlock, Grid, LoadingBlock, Muted, Row, TextField } from '../../ui';

const schema = Yup.object({
    empresa: Yup.string().trim().required('Informe a empresa'),
    cnpj: Yup.string().required('Informe o CNPJ'),
    banco: Yup.string().trim().required('Informe o banco'),
    agencia: Yup.string().trim().required('Informe a agência'),
    posto: Yup.string().trim().required('Informe o posto'),
    conta: Yup.string().trim().required('Informe a conta'),
    codBeneficiario: Yup.string().trim().required('Informe o código do beneficiário'),
    sicrediLogin: Yup.string().trim().required('Informe o login'),
});

const CAMPOS = ['empresa', 'cnpj', 'banco', 'agencia', 'posto', 'conta', 'codBeneficiario', 'sicrediLogin'];

/** Credenciais da conta de cobrança Sicredi e instruções do webhook de baixa automática. */
export default function Integracao() {
    const queryClient = useQueryClient();
    const [removendo, setRemovendo] = useState(false);
    const [homologando, setHomologando] = useState(false);
    const conta = useQuery({ queryKey: ['financeiro', 'conta'], queryFn: financeiroApi.conta });
    const status = useQuery({ queryKey: ['sicredi', 'status'], queryFn: sicrediApi.status });

    const testar = useMutation({
        mutationFn: () => bancosApi.testar('sicredi'),
        onSuccess: (resultado) => (resultado.sucesso ? toast.success(resultado.mensagem) : toast.error(resultado.mensagem, { duration: 7000 })),
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const salvar = useMutation({
        mutationFn: ({ id, payload }) => (id ? financeiroApi.updateConta(id, payload) : financeiroApi.createConta(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro', 'conta'] });
            toast.success('Integração salva.');
        },
    });

    const remover = useMutation({
        mutationFn: () => financeiroApi.removeConta(conta.data.id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['financeiro', 'conta'] });
            setRemovendo(false);
            toast.success('Conta removida.');
        },
        onError: (erro) => {
            setRemovendo(false);
            toast.error(errorMessage(erro));
        },
    });

    if (conta.isLoading) return <LoadingBlock />;
    if (conta.error) return <ErrorBlock message={errorMessage(conta.error)} onRetry={conta.refetch} />;

    const existente = conta.data;

    return (
        <>
            <Card>
                <Row $justify="space-between">
                    <CardTitle>Conta de cobrança Sicredi</CardTitle>
                    {existente ? <Badge $tone="success">Configurada</Badge> : <Badge $tone="warning">Não configurada</Badge>}
                </Row>
                <p style={{ marginBottom: 10 }}><Muted>Usada para emitir boletos, consultar situação e receber a baixa dos pagamentos. O código de acesso fica criptografado e não é exibido.</Muted></p>

                {status.data && (
                    <Row style={{ marginBottom: 14 }}>
                        <Badge $tone={status.data.ambiente === 'PRODUCAO' ? 'success' : 'warning'}>
                            {status.data.ambiente === 'PRODUCAO' ? 'Ambiente de produção' : 'Ambiente de testes (sandbox)'}
                        </Badge>
                        {!status.data.apiKeyConfigurada && <Badge $tone="danger">Chave da API não configurada no servidor</Badge>}
                        {status.data.webhook.ultimoAviso ? (
                            <Muted>Último aviso de pagamento: {dataHoraBr(status.data.webhook.ultimoAviso.recebidoEm)}</Muted>
                        ) : (
                            <Muted>Nenhum aviso de pagamento recebido ainda.</Muted>
                        )}
                    </Row>
                )}

                <Formik
                    enableReinitialize
                    initialValues={{
                        empresa: existente?.empresa ?? '',
                        cnpj: existente?.cnpj ?? '',
                        banco: existente?.banco ?? '748 - Sicredi',
                        agencia: existente?.agencia ?? '',
                        posto: existente?.posto ?? '',
                        conta: existente?.conta ?? '',
                        codBeneficiario: existente?.codBeneficiario ?? '',
                        sicrediLogin: existente?.sicrediLogin ?? '',
                        sicrediPassword: '',
                    }}
                    validationSchema={schema.shape({
                        sicrediPassword: existente ? Yup.string() : Yup.string().required('Informe a senha'),
                    })}
                    onSubmit={async (values, { setErrors }) => {
                        const payload = Object.fromEntries(CAMPOS.map((campo) => [campo, values[campo]]));
                        if (values.sicrediPassword) payload.sicrediPassword = values.sicrediPassword;

                        try {
                            await salvar.mutateAsync({ id: existente?.id, payload });
                        } catch (erro) {
                            const detalhes = fieldErrors(erro);
                            if (Object.keys(detalhes).length > 0) setErrors(detalhes);
                            else toast.error(errorMessage(erro));
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form noValidate>
                            <Grid $cols={2}>
                                <TextField name="empresa" label="Empresa" required />
                                <TextField name="cnpj" label="CNPJ" mask="cnpj" required />
                                <TextField name="banco" label="Banco" required />
                                <TextField name="conta" label="Conta" required />
                                <TextField name="agencia" label="Cooperativa" required hint="4 dígitos." />
                                <TextField name="posto" label="Posto (agência)" required hint="2 dígitos. Está em Cobrança > Cadastrar títulos." />
                                <TextField name="codBeneficiario" label="Código do beneficiário" required hint="5 dígitos (código do convênio)." />
                                <TextField name="sicrediLogin" label="Usuário da API" required hint="Código do beneficiário + cooperativa (9 dígitos)." />
                            </Grid>
                            <TextField
                                name="sicrediPassword"
                                label={existente ? 'Novo código de acesso (deixe em branco para manter)' : 'Código de acesso'}
                                hint="Gerado no Internet Banking: Cobrança > Código de Acesso > Gerar."
                                type="password"
                                autoComplete="new-password"
                                required={!existente}
                            />
                            <Row style={{ marginTop: 8 }}>
                                <Button type="submit" loading={isSubmitting}>Salvar</Button>
                                {existente && <Button variant="secondary" loading={testar.isPending} onClick={() => testar.mutate()}>Testar conexão</Button>}
                                <Button variant="secondary" onClick={() => setHomologando(true)}>Testar no sandbox</Button>
                                {existente && <Button variant="danger" onClick={() => setRemovendo(true)}>Remover integração</Button>}
                            </Row>
                        </Form>
                    )}
                </Formik>
            </Card>

            {homologando && <HomologacaoDialog onClose={() => setHomologando(false)} />}

            <ConfirmDialog
                open={removendo}
                title="Remover integração"
                message="Remover a conta Sicredi? Novos boletos não poderão ser emitidos até configurar novamente."
                confirmLabel="Remover"
                danger
                loading={remover.isPending}
                onConfirm={() => remover.mutate()}
                onClose={() => setRemovendo(false)}
            />
        </>
    );
}
