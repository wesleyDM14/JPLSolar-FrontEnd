import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, useFormikContext } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationTriangle, FaFileCode } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { contratosApi, fiscalApi, saveResponse } from '../../../api/resources';
import ParteField from '../../../components/ParteField';
import { Badge, Button, DateField, Dialog, FilterSelect, Grid, KeyValue, LoadingBlock, Muted, SelectField, TextField, TextareaField, tokens } from '../../../ui';
import CamposServico from './CamposServico';
import { hojeIso } from '../../../utils/datas';
import { formatCurrency, formatDate } from '../../../utils/masks';

const { colors } = tokens;

const schema = Yup.object({
    clienteId: Yup.string().required('Escolha o cliente (tomador do serviço)'),
    valorServicos: Yup.number().typeError('Informe o valor').moreThan(0, 'Informe o valor do serviço').required('Informe o valor'),
    discriminacao: Yup.string().trim().min(3, 'Descreva o serviço prestado').required('Descreva o serviço prestado'),
    itemListaServico: Yup.string().trim().required('Informe o item da lista de serviços'),
    aliquotaIss: Yup.number().transform((v, o) => (o === '' ? undefined : v)).min(0).max(100),
});


/** Itens da lista de serviços (LC 116) que a prefeitura trata como obra: pedem o código da obra (CNO). */
const ITENS_DE_OBRA = ['07.02', '07.04', '07.05', '07.06', '07.07', '07.08'];

/** Código da obra e ART: só aparecem quando o item do serviço é de obra (nos demais a prefeitura recusa). */
function CamposObra() {
    const { values } = useFormikContext();
    if (!ITENS_DE_OBRA.includes(String(values.itemListaServico ?? '').trim())) return null;

    return (
        <Grid $cols={2}>
            <TextField name="codigoObra" label="Código da obra (CNO)" hint="Obrigatório para este item (serviço de obra)." />
            <TextField name="art" label="ART (opcional)" />
        </Grid>
    );
}

function ResumoIss() {
    const { values } = useFormikContext();
    const valor = Number(values.valorServicos);
    const aliquota = Number(values.aliquotaIss);

    if (!(valor > 0) || values.aliquotaIss === '' || !Number.isFinite(aliquota)) return null;

    const iss = Math.round(valor * aliquota) / 100;
    return (
        <Muted>
            ISS estimado: <strong>{formatCurrency(iss)}</strong> ({aliquota.toLocaleString('pt-BR')}%)
            {values.issRetido === 'true' ? ' — retido pelo tomador' : ''}.
        </Muted>
    );
}

/** Quando a emissão parte de um contrato: escolher faturar o total ou uma parcela. */
function OrigemDoValor({ opcoes }) {
    const { values, setFieldValue } = useFormikContext();
    const atual = opcoes.find((o) => o.lancamentoId === (values.lancamentoId || undefined)) ?? opcoes[0];

    return (
        <FilterSelect
            label="Valor a faturar"
            placeholder={null}
            value={atual.id}
            onChange={(e) => {
                const escolhida = opcoes.find((o) => o.id === e.target.value);
                setFieldValue('valorServicos', escolhida.valor);
                setFieldValue('lancamentoId', escolhida.lancamentoId ?? '');
            }}
            options={opcoes.map((o) => ({ value: o.id, label: o.rotulo }))}
        />
    );
}

function ContratoDoCliente() {
    const { values } = useFormikContext();
    const contratos = useQuery({
        queryKey: ['contratos', 'para-emissao', values.clienteId],
        queryFn: () => contratosApi.list({ clienteId: values.clienteId, pageSize: 50 }),
        enabled: Boolean(values.clienteId),
    });

    return (
        <SelectField
            name="contratoId"
            label="Contrato (opcional)"
            placeholder={values.clienteId ? 'Sem contrato' : 'Escolha o cliente primeiro'}
            disabled={!values.clienteId}
            options={(contratos.data?.data ?? []).map((c) => ({ value: c.id, label: `${formatDate(c.dataContrato)} · ${formatCurrency(c.priceTotal)}` }))}
        />
    );
}

/**
 * Emissão de NFS-e pelo webservice da prefeitura. `preset` pré-preenche o formulário (cliente, valor, descrição e
 * vínculos com contrato, usina ou lançamento) quando a emissão parte de outra tela.
 */
export function EmitirNotaDialog({ open, onClose, preset }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [resultado, setResultado] = useState(null);
    const [ultimosValores, setUltimosValores] = useState(null);

    const configuracao = useQuery({ queryKey: ['fiscal', 'configuracao'], queryFn: fiscalApi.configuracao, enabled: open });
    // A atividade padrão (primeira da lista) já vem escolhida; o back-end também a usa se nenhuma for enviada.
    const padrao = useQuery({
        queryKey: ['fiscal', 'atividades', 'padrao'],
        queryFn: async () => (await fiscalApi.atividades({ ativo: 'true', pageSize: 1 })).data.find((a) => a.padrao) ?? null,
        enabled: open,
    });

    const emitir = useMutation({
        mutationFn: (payload) => fiscalApi.emitirNfse(payload),
        onSuccess: async (dados) => {
            setResultado(dados);
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
        },
    });

    const fechar = () => {
        setResultado(null);
        setUltimosValores(null);
        onClose();
    };

    if (!open) return null;

    const nfse = configuracao.data?.nfse;
    const config = configuracao.data;

    if (configuracao.isLoading || padrao.isLoading) {
        return (
            <Dialog open width={640} title="Emitir NFS-e" onClose={fechar}>
                <LoadingBlock />
            </Dialog>
        );
    }

    if (nfse && !nfse.pronto) {
        return (
            <Dialog
                open
                width={560}
                title="Emitir NFS-e"
                subtitle="Falta concluir a configuração"
                onClose={fechar}
                footer={
                    <>
                        <Button variant="secondary" onClick={fechar}>Fechar</Button>
                        <Button onClick={() => navigate('/financeiro/fiscal/configuracao')}>Abrir configuração fiscal</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: colors.warningBg }}>
                    <FaExclamationTriangle style={{ marginTop: 3 }} />
                    <div>
                        <strong>Para emitir pelo sistema, informe:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                            {nfse.pendencias.map((p) => <li key={p}>{p}</li>)}
                        </ul>
                    </div>
                </div>
            </Dialog>
        );
    }

    if (resultado) {
        const ok = resultado.status === 'AUTORIZADA';
        const nota = resultado.nota;

        return (
            <Dialog
                open
                width={620}
                title={ok ? 'Nota emitida' : 'Nota não emitida'}
                subtitle={ok ? `NFS-e nº ${resultado.numero}` : 'A prefeitura recusou o RPS. Corrija e tente de novo.'}
                onClose={fechar}
                footer={
                    <>
                        {ok && nota?.temXml && (
                            <Button
                                variant="secondary"
                                icon={<FaFileCode />}
                                onClick={async () => {
                                    try {
                                        saveResponse(await fiscalApi.xml(nota.id), `NFS-e ${resultado.numero}.xml`);
                                    } catch (erro) {
                                        toast.error(errorMessage(erro, 'Não foi possível baixar o XML.'));
                                    }
                                }}
                            >
                                Baixar XML
                            </Button>
                        )}
                        {!ok && <Button variant="secondary" onClick={() => setResultado(null)}>Voltar ao formulário</Button>}
                        <Button onClick={fechar}>Concluir</Button>
                    </>
                }
            >
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: ok ? colors.successBg : colors.dangerBg, color: ok ? colors.success : colors.danger }}>
                        {ok ? <FaCheckCircle size={22} /> : <FaExclamationTriangle size={22} />}
                        <strong>{ok ? 'Autorizada pela prefeitura' : 'Rejeitada pela prefeitura'}</strong>
                    </div>

                    {ok && (
                        <Grid $cols={3}>
                            <KeyValue label="Número">{resultado.numero}</KeyValue>
                            <KeyValue label="Código de verificação">{resultado.codigoVerificacao}</KeyValue>
                            <KeyValue label="Valor">{formatCurrency(nota?.valorTotal)}</KeyValue>
                            <KeyValue label="ISS">{formatCurrency(nota?.valorIss)}</KeyValue>
                            <KeyValue label="Tomador">{nota?.parteNome}</KeyValue>
                            <KeyValue label="RPS">{nota ? `${nota.rpsNumero} / ${nota.rpsSerie}` : ''}</KeyValue>
                        </Grid>
                    )}

                    {resultado.mensagens?.length > 0 && (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                            {resultado.mensagens.map((m, i) => (
                                <li key={`${m.codigo}-${i}`} style={{ padding: 10, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                                    <Badge $tone="danger">{m.codigo}</Badge> {m.mensagem}
                                    {m.correcao && <div><Muted>Correção: {m.correcao}</Muted></div>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Dialog>
        );
    }

    const competenciaInicial = `${hojeIso().slice(0, 8)}01`;

    return (
        <Formik
            initialValues={ultimosValores ?? {
                clienteId: preset?.clienteId ?? '',
                atividadeId: padrao.data?.id ?? '',
                codigoCnae: padrao.data?.codigoCnae ?? config?.codigoCnaePadrao ?? '',
                lancamentoId: preset?.lancamentoId ?? '',
                valorServicos: preset?.valorServicos ?? '',
                discriminacao: preset?.discriminacao ?? '',
                itemListaServico: padrao.data?.itemListaServico ?? config?.itemListaServicoPadrao ?? '',
                codigoTributacao: padrao.data?.codigoTributacao ?? config?.codigoTributacaoPadrao ?? '',
                aliquotaIss: padrao.data?.aliquotaIss ?? config?.aliquotaIssPadrao ?? '',
                issRetido: padrao.data?.issRetido ? 'true' : 'false',
                competencia: competenciaInicial,
                contratoId: preset?.contratoId ?? '',
                informacoesComplementares: '',
                codigoObra: '',
                art: '',
            }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                setUltimosValores(values);
                try {
                    await emitir.mutateAsync({
                        clienteId: values.clienteId,
                        valorServicos: Number(values.valorServicos),
                        discriminacao: values.discriminacao,
                        itemListaServico: values.itemListaServico,
                        codigoTributacao: values.codigoTributacao || undefined,
                        aliquotaIss: values.aliquotaIss === '' ? undefined : Number(values.aliquotaIss),
                        issRetido: values.issRetido === 'true',
                        competencia: values.competencia || undefined,
                        contratoId: values.contratoId || undefined,
                        atividadeId: values.atividadeId || undefined,
                        codigoCnae: values.codigoCnae || undefined,
                        usinaId: preset?.usinaId,
                        lancamentoId: values.lancamentoId || undefined,
                        informacoesComplementares: values.informacoesComplementares || undefined,
                        codigoObra: ITENS_DE_OBRA.includes(String(values.itemListaServico ?? '').trim()) ? values.codigoObra || undefined : undefined,
                        art: ITENS_DE_OBRA.includes(String(values.itemListaServico ?? '').trim()) ? values.art || undefined : undefined,
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
                    width={700}
                    title="Emitir NFS-e"
                    subtitle={`Ambiente de ${config?.ambiente === 'PRODUCAO' ? 'produção — a nota tem valor fiscal' : 'homologação — apenas testes'}`}
                    onClose={fechar}
                    footer={
                        <>
                            <Button variant="secondary" onClick={fechar}>Cancelar</Button>
                            <Button type="submit" form="emitir-nfse-form" loading={isSubmitting}>Emitir nota</Button>
                        </>
                    }
                >
                    <Form noValidate id="emitir-nfse-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            <Grid $cols={2}>
                                <ParteField name="clienteId" parte="cliente" label="Cliente (tomador)" required />
                                <ContratoDoCliente />
                                {preset?.opcoes?.length > 0 && <OrigemDoValor opcoes={preset.opcoes} />}
                                <TextField name="valorServicos" label="Valor do serviço (R$)" type="number" step="0.01" min="0" required />
                                <DateField name="competencia" label="Competência" />
                                <CamposServico />
                            </Grid>
                            <ResumoIss />
                            <CamposObra />
                            <TextareaField name="discriminacao" label="Discriminação do serviço" rows={4} required hint="Aparece na nota. Quebras de linha são mantidas." />
                            <TextareaField name="informacoesComplementares" label="Informações complementares" rows={2} />
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}
