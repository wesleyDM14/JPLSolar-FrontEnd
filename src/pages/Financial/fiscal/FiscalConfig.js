import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import { FaBuilding, FaCog, FaEnvelope, FaFileInvoiceDollar, FaFileSignature, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { Badge, Button, Card, ErrorBlock, Grid, LoadingBlock, Muted, Page, PageHeader, Reveal, Row, SectionTitle, SelectField, TextField } from '../../../ui';
import NfseAcesso from './NfseAcesso';
import { AMBIENTES, REGIMES } from './formato';

const schema = Yup.object({
    cnpj: Yup.string().test('cnpj', 'O CNPJ deve ter 14 dígitos', (v) => !v || v.replace(/\D/g, '').length === 14),
    emailContador: Yup.string().email('E-mail inválido'),
    codigoMunicipio: Yup.string().test('ibge', 'O código IBGE tem 7 dígitos', (v) => !v || /^\d{7}$/.test(v)),
    aliquotaIssPadrao: Yup.number().transform((v, o) => (o === '' ? undefined : v)).min(0, 'Mínimo 0').max(100, 'Máximo 100'),
});

/** Dados fiscais da empresa, certificado e contador. */
export default function FiscalConfig() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({ queryKey: ['fiscal', 'configuracao'], queryFn: fiscalApi.configuracao });

    const salvar = useMutation({
        mutationFn: (payload) => fiscalApi.salvarConfiguracao(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success('Configuração fiscal salva.');
        },
    });

    return (
        <Page>
            <PageHeader
                icon={FaCog}
                tone="gray"
                title="Configuração fiscal"
                subtitle="Dados da empresa e do contador."
                actions={<Button variant="secondary" icon={<FaFileInvoiceDollar />} onClick={() => navigate('/financeiro/fiscal')}>Voltar às notas</Button>}
            />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <Formik
                    enableReinitialize
                    initialValues={{
                        razaoSocial: data.razaoSocial ?? '',
                        nomeFantasia: data.nomeFantasia ?? '',
                        cnpj: data.cnpj ?? '',
                        inscricaoEstadual: data.inscricaoEstadual ?? '',
                        inscricaoMunicipal: data.inscricaoMunicipal ?? '',
                        regimeTributario: data.regimeTributario,
                        cnae: data.cnae ?? '',
                        ambiente: data.ambiente,
                        serieNfe: data.serieNfe ?? '1',
                        serieNfse: data.serieNfse ?? '1',
                        nomeContador: data.nomeContador ?? '',
                        emailContador: data.emailContador ?? '',
                        telefoneContador: data.telefoneContador ?? '',
                        codigoMunicipio: data.codigoMunicipio ?? '',
                        itemListaServicoPadrao: data.itemListaServicoPadrao ?? '',
                        codigoTributacaoPadrao: data.codigoTributacaoPadrao ?? '',
                        codigoCnaePadrao: data.codigoCnaePadrao ?? '',
                        aliquotaIssPadrao: data.aliquotaIssPadrao ?? '',
                        serieRps: data.serieRps ?? '1',
                        proximoNumeroRps: data.proximoNumeroRps ?? 1,
                        incentivoFiscal: data.incentivoFiscal ? 'true' : 'false',
                        enviarIbsCbs: data.enviarIbsCbs === false ? 'false' : 'true',
                    }}
                    validationSchema={schema}
                    onSubmit={async (values, { setErrors }) => {
                        const payload = Object.fromEntries(Object.entries(values).map(([campo, valor]) => [campo, valor === '' ? undefined : valor]));
                        payload.incentivoFiscal = values.incentivoFiscal === 'true';
                        payload.enviarIbsCbs = values.enviarIbsCbs === 'true';
                        try {
                            await salvar.mutateAsync(payload);
                        } catch (erro) {
                            const campos = fieldErrors(erro);
                            if (Object.keys(campos).length > 0) setErrors(campos);
                            else toast.error(errorMessage(erro));
                        }
                    }}
                >
                    {({ isSubmitting, dirty }) => (
                        <Form noValidate>
                            <Reveal>
                                <Card>
                                    <SectionTitle icon={FaBuilding} tom="blue">Empresa</SectionTitle>
                                    <Grid $cols={2}>
                                        <TextField name="razaoSocial" label="Razão social" />
                                        <TextField name="nomeFantasia" label="Nome fantasia" />
                                        <TextField name="cnpj" label="CNPJ" mask="cnpj" />
                                        <TextField name="cnae" label="CNAE principal" />
                                        <TextField name="inscricaoEstadual" label="Inscrição estadual" />
                                        <TextField name="inscricaoMunicipal" label="Inscrição municipal" />
                                        <SelectField name="regimeTributario" label="Regime tributário" options={REGIMES} placeholder="Selecione" />
                                        <SelectField name="ambiente" label="Ambiente das notas" options={AMBIENTES} placeholder="Selecione" />
                                        <TextField name="serieNfe" label="Série da NF-e" />
                                        <TextField name="serieNfse" label="Série da NFS-e" />
                                    </Grid>
                                </Card>
                            </Reveal>

                            <Reveal $delay={40}>
                                <Card>
                                    <SectionTitle icon={FaFileSignature} tom="purple">Parâmetros da NFS-e</SectionTitle>
                                    <Grid $cols={3}>
                                        <TextField name="codigoMunicipio" label="Código IBGE do município" hint="São Miguel/RN: 2412500" maxLength={7} />
                                        <TextField name="itemListaServicoPadrao" label="Item da lista de serviços (padrão)" hint="Ex.: 07.02" />
                                        <TextField name="codigoTributacaoPadrao" label="Código de tributação municipal" />
                                        <TextField name="codigoCnaePadrao" label="CNAE do serviço" />
                                        <TextField name="aliquotaIssPadrao" label="Alíquota de ISS (%)" type="number" step="0.01" min="0" />
                                        <SelectField
                                            name="incentivoFiscal"
                                            label="Incentivo fiscal"
                                            placeholder={null}
                                            options={[{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim' }]}
                                        />
                                        <SelectField
                                            name="enviarIbsCbs"
                                            label="Informar IBS/CBS na nota"
                                            placeholder={null}
                                            options={[{ value: 'true', label: 'Sim (Reforma Tributária)' }, { value: 'false', label: 'Não (a prefeitura classifica)' }]}
                                        />
                                        <TextField name="serieRps" label="Série do RPS" />
                                        <TextField name="proximoNumeroRps" label="Próximo número do RPS" type="number" min="1" hint="Só altere se já emitiu RPS fora do sistema." />
                                    </Grid>
                                </Card>
                            </Reveal>

                            <Reveal $delay={80}>
                                <NfseAcesso nfse={data.nfse} />
                            </Reveal>

                            <Reveal $delay={120}>
                                <Card>
                                    <SectionTitle icon={FaUserTie} tom="green" aside={data.emailDisponivel ? <Badge $tone="success">E-mail ativo</Badge> : <Badge $tone="warning">E-mail ainda não habilitado no servidor</Badge>}>
                                        Contador
                                    </SectionTitle>
                                    <Grid $cols={3}>
                                        <TextField name="nomeContador" label="Nome / escritório" />
                                        <TextField name="emailContador" label="E-mail para envio dos documentos" type="email" />
                                        <TextField name="telefoneContador" label="Telefone" mask="phone" />
                                    </Grid>
                                    <p style={{ margin: '10px 0 0' }}>
                                        <Muted><FaEnvelope style={{ verticalAlign: '-2px' }} /> Os pacotes (relatórios do mês e XMLs) são enviados para este e-mail pela tela Contabilidade.</Muted>
                                    </p>
                                </Card>
                            </Reveal>

                            <Row $justify="flex-end">
                                <Button type="submit" loading={isSubmitting} disabled={!dirty}>Salvar configuração</Button>
                            </Row>
                        </Form>
                    )}
                </Formik>
            )}
        </Page>
    );
}
