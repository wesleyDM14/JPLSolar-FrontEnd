import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFileImport, FaFileInvoiceDollar, FaListUl, FaMagic, FaPlus, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../../api/client';
import { fiscalApi } from '../../../api/resources';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    Dialog,
    ErrorBlock,
    FilterInput,
    FilterSelect,
    Grid,
    Muted,
    Page,
    PageHeader,
    PaginationBar,
    Row,
    RowActions,
    SelectField,
    Tabs,
    TextField,
    TextareaField,
} from '../../../ui';

const schema = Yup.object({
    descricao: Yup.string().trim().min(3, 'Descreva a atividade').required('Descreva a atividade'),
    itemListaServico: Yup.string().trim().matches(/^\d{1,2}\.\d{2}$/, 'Use o formato da lista (ex.: 07.02)').required('Informe o item da lista'),
    aliquotaIss: Yup.number().transform((v, o) => (o === '' ? undefined : v)).min(0, 'Mínimo 0').max(100, 'Máximo 100'),
});

const schemaCnae = Yup.object({
    codigo: Yup.string().test('cnae', 'O CNAE tem 7 dígitos (ex.: 4321-5/00)', (v) => (v ?? '').replace(/\D/g, '').length === 7).required('Informe o CNAE'),
    descricao: Yup.string().trim().min(3, 'Descreva a atividade').required('Descreva a atividade'),
    itemListaSugerido: Yup.string().trim().test('item', 'Use o formato da lista (ex.: 07.02)', (v) => !v || /^\d{1,2}\.\d{2}$/.test(v)),
});

const SIM_NAO = [{ value: 'false', label: 'Não' }, { value: 'true', label: 'Sim' }];

const percentual = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`);

/** Ao escolher o CNAE, sugere item da lista e descrição quando esses campos ainda estão vazios. */
function SugerirDoCnae({ cnaes }) {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const cnae = cnaes.find((c) => c.codigo === values.codigoCnae);
        if (!cnae) return;
        if (!values.itemListaServico && cnae.itemListaSugerido) setFieldValue('itemListaServico', cnae.itemListaSugerido);
        if (!values.descricao) setFieldValue('descricao', cnae.descricao);
        // Só reage à troca do CNAE.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.codigoCnae]);

    return null;
}

const combinacaoValor = (c) => `${c.indicadorOperacao}|${c.classificacaoTributaria}`;

/**
 * Classificação da Reforma Tributária (IBS/CBS): NBS, indicador da operação e classificação tributária, a partir
 * do Anexo VIII da NFS-e. Ao informar o item da lista, sugere o primeiro registro da correlação (o mesmo que a
 * prefeitura escolheria sozinha); o usuário pode trocar a NBS e a classificação.
 */
function ClassificacaoIbsCbs() {
    const { values, setFieldValue } = useFormikContext();
    const item = String(values.itemListaServico ?? '').trim();
    const itemCompleto = /^\d{1,2}\.\d{2}$/.test(item);

    const detalhe = useQuery({
        queryKey: ['fiscal', 'rtc', item],
        queryFn: () => fiscalApi.rtcItem(item),
        enabled: itemCompleto,
        retry: false,
        staleTime: 5 * 60_000,
    });
    const nbsLista = detalhe.data?.nbs ?? [];
    const nbsAtual = nbsLista.find((n) => n.codigo === values.codigoNbs);
    const combinacoes = nbsAtual?.combinacoes ?? [];

    // Item mudou (ou carregou): garante NBS e combinação válidas, sugerindo o primeiro registro.
    useEffect(() => {
        if (!detalhe.data) return;
        const nbs = nbsLista.find((n) => n.codigo === values.codigoNbs) ?? nbsLista[0];
        if (!nbs) return;
        if (nbs.codigo !== values.codigoNbs) setFieldValue('codigoNbs', nbs.codigo);
        if (!nbs.combinacoes.some((c) => combinacaoValor(c) === values.combinacao)) {
            const primeira = nbs.combinacoes[0];
            setFieldValue('combinacao', primeira ? combinacaoValor(primeira) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detalhe.data, values.codigoNbs]);

    if (!itemCompleto) {
        return <Muted>Informe o item da lista para ver a classificação IBS/CBS.</Muted>;
    }
    if (detalhe.isError) {
        return <Muted>Este item não consta no Anexo VIII da NFS-e; a prefeitura classificará pelo cadastro dela.</Muted>;
    }

    const combo = combinacoes.find((c) => combinacaoValor(c) === values.combinacao);

    return (
        <div style={{ display: 'grid', gap: 10 }}>
            <SelectField
                name="codigoNbs"
                label="NBS (serviço)"
                placeholder="Selecione"
                options={nbsLista.map((n) => ({ value: n.codigo, label: `${n.codigo} · ${n.descricao}` }))}
            />
            <SelectField
                name="combinacao"
                label="Indicador da operação e classificação tributária"
                placeholder="Selecione"
                options={combinacoes.map((c) => ({
                    value: combinacaoValor(c),
                    label: `${c.classificacaoTributaria} · ${c.classificacaoNome ?? 'sem descrição'} · operação ${c.indicadorOperacao}`,
                }))}
            />
            {combo && (
                <Muted>
                    CST {combo.cst} · {combo.indicadorDescricao ?? 'indicador da operação'}
                    {combo.local ? ` · local de incidência: ${combo.local}` : ''}
                </Muted>
            )}
        </div>
    );
}

function AtividadeDialog({ registro, inicial, cnaes, onClose }) {
    const queryClient = useQueryClient();

    const salvar = useMutation({
        mutationFn: ({ id, payload }) => (id ? fiscalApi.atualizarAtividade(id, payload) : fiscalApi.criarAtividade(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success('Atividade salva.');
            onClose();
        },
    });

    const base = registro ?? inicial ?? {};

    return (
        <Formik
            initialValues={{
                descricao: base.descricao ?? '',
                itemListaServico: base.itemListaServico ?? '',
                codigoCnae: base.codigoCnae ?? '',
                codigoTributacao: base.codigoTributacao ?? '',
                aliquotaIss: base.aliquotaIss ?? '',
                issRetido: base.issRetido ? 'true' : 'false',
                codigoNbs: base.codigoNbs ?? '',
                combinacao: base.indicadorOperacao && base.classificacaoTributaria ? `${base.indicadorOperacao}|${base.classificacaoTributaria}` : '',
                padrao: base.padrao ? 'true' : 'false',
                ativo: registro ? (registro.ativo ? 'true' : 'false') : 'true',
                discriminacaoModelo: base.discriminacaoModelo ?? '',
            }}
            validationSchema={schema}
            onSubmit={async (values, { setErrors }) => {
                const payload = {
                    descricao: values.descricao.trim(),
                    itemListaServico: values.itemListaServico.trim(),
                    codigoTributacao: values.codigoTributacao || undefined,
                    codigoCnae: values.codigoCnae || undefined,
                    aliquotaIss: values.aliquotaIss === '' ? null : Number(values.aliquotaIss),
                    issRetido: values.issRetido === 'true',
                    padrao: values.padrao === 'true',
                    ativo: values.ativo === 'true',
                    discriminacaoModelo: values.discriminacaoModelo || undefined,
                    codigoNbs: values.codigoNbs || undefined,
                    indicadorOperacao: values.combinacao ? values.combinacao.split('|')[0] : undefined,
                    classificacaoTributaria: values.combinacao ? values.combinacao.split('|')[1] : undefined,
                };
                try {
                    await salvar.mutateAsync({ id: registro?.id, payload });
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
                    width={640}
                    onClose={onClose}
                    title={registro ? 'Editar atividade' : 'Nova atividade'}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="atividade-form" loading={isSubmitting}>Salvar</Button>
                        </>
                    }
                >
                    <Form noValidate id="atividade-form">
                        <SugerirDoCnae cnaes={cnaes} />
                        <div style={{ display: 'grid', gap: 14 }}>
                            <SelectField
                                name="codigoCnae"
                                label="CNAE da empresa"
                                placeholder="Sem CNAE"
                                hint="Atividades da empresa (cadastro do CNPJ). Ao escolher, o item da lista é sugerido."
                                options={cnaes.map((c) => ({ value: c.codigo, label: `${c.codigoFormatado} · ${c.descricao}` }))}
                            />
                            <TextField name="descricao" label="Atividade" required hint="Nome que aparece na lista de emissão." />
                            <Grid $cols={2}>
                                <TextField name="itemListaServico" label="Item da lista de serviços (LC 116)" required hint="Ex.: 07.02" />
                                <TextField name="codigoTributacao" label="Código de tributação do município" hint="No Tributus da JPL é o CNAE da atividade (ex.: 7112000)." />
                                <TextField name="aliquotaIss" label="Alíquota de ISS (%)" type="number" step="0.01" min="0" />
                                <SelectField name="issRetido" label="ISS retido pelo tomador" placeholder={null} options={SIM_NAO} />
                                <SelectField name="ativo" label="Ativa" placeholder={null} options={SIM_NAO} />
                                <SelectField name="padrao" label="Atividade padrão" placeholder={null} options={SIM_NAO} hint="Vem escolhida ao emitir uma nota." />
                            </Grid>
                            <div>
                                <strong>Reforma Tributária (IBS/CBS)</strong>
                                <div style={{ marginTop: 8 }}><ClassificacaoIbsCbs /></div>
                            </div>
                            <TextareaField
                                name="discriminacaoModelo"
                                label="Texto padrão da discriminação (opcional)"
                                rows={3}
                                hint="Preenche a discriminação da nota quando esta atividade é escolhida."
                            />
                        </div>
                    </Form>
                    {registro && <Row style={{ marginTop: 10 }}><Muted>Usada em {registro.notas} nota(s).</Muted></Row>}
                </Dialog>
            )}
        </Formik>
    );
}

function CnaeDialog({ registro, onClose }) {
    const queryClient = useQueryClient();

    const salvar = useMutation({
        mutationFn: ({ id, payload }) => (id ? fiscalApi.atualizarCnae(id, payload) : fiscalApi.criarCnae(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success('CNAE salvo.');
            onClose();
        },
    });

    return (
        <Formik
            initialValues={{
                codigo: registro?.codigoFormatado ?? '',
                descricao: registro?.descricao ?? '',
                principal: registro?.principal ? 'true' : 'false',
                itemListaSugerido: registro?.itemListaSugerido ?? '',
                observacao: registro?.observacao ?? '',
            }}
            validationSchema={schemaCnae}
            onSubmit={async (values, { setErrors }) => {
                const payload = {
                    codigo: values.codigo,
                    descricao: values.descricao.trim(),
                    principal: values.principal === 'true',
                    itemListaSugerido: values.itemListaSugerido || undefined,
                    observacao: values.observacao || undefined,
                };
                try {
                    await salvar.mutateAsync({ id: registro?.id, payload });
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
                    width={560}
                    onClose={onClose}
                    title={registro ? 'Editar CNAE' : 'Adicionar CNAE'}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="cnae-form" loading={isSubmitting}>Salvar</Button>
                        </>
                    }
                >
                    <Form noValidate id="cnae-form">
                        <div style={{ display: 'grid', gap: 14 }}>
                            <Grid $cols={2}>
                                <TextField name="codigo" label="CNAE" required hint="Ex.: 4321-5/00" />
                                <SelectField name="principal" label="Atividade principal" placeholder={null} options={SIM_NAO} />
                            </Grid>
                            <TextField name="descricao" label="Descrição" required />
                            <TextField name="itemListaSugerido" label="Item da lista sugerido" hint="Ex.: 07.02 — vem preenchido ao criar uma atividade deste CNAE." />
                            <TextField name="observacao" label="Observação" />
                        </div>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}

function ImportarCnaesDialog({ onClose }) {
    const queryClient = useQueryClient();
    const [texto, setTexto] = useState('');

    const importar = useMutation({
        mutationFn: () => fiscalApi.importarCnaes(texto),
        onSuccess: async (resultado) => {
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            toast.success(`${resultado.encontrados} CNAE(s) lidos: ${resultado.criados} novo(s), ${resultado.atualizados} atualizado(s).`);
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    return (
        <Dialog
            open
            width={640}
            title="Importar do cartão CNPJ"
            subtitle="Cole o trecho com a atividade principal e as secundárias."
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button icon={<FaFileImport />} loading={importar.isPending} disabled={texto.trim().length < 10} onClick={() => importar.mutate()}>Importar</Button>
                </>
            }
        >
            <textarea
                rows={12}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={'7112-0/00 - Serviços de engenharia\n...\n4321-5/00 - Instalação e manutenção elétrica'}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontFamily: 'inherit' }}
            />
            <p style={{ margin: '8px 0 0' }}>
                <Muted>Os CNAEs já cadastrados são atualizados; nada é apagado. O item da lista é sugerido quando conhecido.</Muted>
            </p>
        </Dialog>
    );
}

/**
 * Catálogo de atividades de serviço da NFS-e: cada uma guarda item da lista (LC 116), código de tributação
 * do município, CNAE e alíquota. A marcada como padrão vem preenchida na emissão. Os CNAEs da empresa
 * (cadastro do CNPJ) filtram o que ela realmente faz.
 */
export default function Atividades() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [aba, setAba] = useState('atividades');
    const [busca, setBusca] = useState('');
    const [situacao, setSituacao] = useState('true');
    const [origem, setOrigem] = useState('true');
    const [page, setPage] = useState(1);
    const [editando, setEditando] = useState(null); // objeto | 'nova' | { inicial }
    const [excluindo, setExcluindo] = useState(null);
    const [cnaeEditando, setCnaeEditando] = useState(null); // objeto | 'novo'
    const [cnaeExcluindo, setCnaeExcluindo] = useState(null);
    const [importando, setImportando] = useState(false);
    const termo = useDebouncedValue(busca, 300);

    const cnaes = useQuery({ queryKey: ['fiscal', 'cnaes'], queryFn: fiscalApi.cnaes });

    const lista = useQuery({
        queryKey: ['fiscal', 'atividades', termo, situacao, origem, page],
        queryFn: () => fiscalApi.atividades({ search: termo, ativo: situacao, daEmpresa: origem, page, pageSize: 20 }),
        placeholderData: (anterior) => anterior,
    });

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ['fiscal'] });

    const tornarPadrao = useMutation({
        mutationFn: (id) => fiscalApi.atividadePadrao(id),
        onSuccess: async () => {
            await invalidar();
            toast.success('Atividade padrão atualizada.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const excluir = useMutation({
        mutationFn: (id) => fiscalApi.excluirAtividade(id),
        onSuccess: async () => {
            await invalidar();
            toast.success('Atividade excluída.');
            setExcluindo(null);
        },
        onError: (erro) => {
            setExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    const classificar = useMutation({
        mutationFn: () => fiscalApi.classificarAtividades(),
        onSuccess: async (resultado) => {
            await invalidar();
            toast.success(resultado.atualizadas > 0 ? `${resultado.atualizadas} atividade(s) classificada(s) pelo Anexo VIII.` : 'Todas as atividades já têm classificação.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const excluirCnae = useMutation({
        mutationFn: (id) => fiscalApi.excluirCnae(id),
        onSuccess: async () => {
            await invalidar();
            toast.success('CNAE removido.');
            setCnaeExcluindo(null);
        },
        onError: (erro) => {
            setCnaeExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    const listaCnaes = cnaes.data ?? [];
    const registro = editando && editando !== 'nova' && !editando.inicial ? editando : null;
    const inicial = editando?.inicial;

    const colunasAtividades = [
        {
            key: 'descricao',
            header: 'Atividade',
            render: (a) => (
                <div>
                    <strong>{a.descricao}</strong>{' '}
                    {a.padrao && <Badge $tone="success"><FaStar style={{ verticalAlign: '-1px' }} /> Padrão</Badge>}{' '}
                    {!a.ativo && <Badge $tone="neutral">Inativa</Badge>}
                </div>
            ),
        },
        { key: 'item', header: 'Item da lista', render: (a) => a.itemListaServico },
        {
            key: 'cnae',
            header: 'CNAE',
            render: (a) => (a.cnae ? <span title={a.cnae.descricao ?? ''}>{a.cnae.codigoFormatado}{!a.cnae.daEmpresa && <Muted> · fora do cadastro</Muted>}</span> : '—'),
        },
        { key: 'trib', header: 'Cód. tributação', render: (a) => a.codigoTributacao || '—' },
        {
            key: 'ibscbs',
            header: 'IBS/CBS',
            render: (a) => (a.classificacaoTributaria ? <span title={a.ibsCbs?.classificacaoNome ?? ''}>{a.classificacaoTributaria}</span> : <Muted>pendente</Muted>),
        },
        { key: 'aliq', header: 'ISS', render: (a) => <>{percentual(a.aliquotaIss)}{a.issRetido && <Muted> · retido</Muted>}</> },
        { key: 'notas', header: 'Notas', render: (a) => a.notas },
        {
            key: 'acoes',
            header: '',
            render: (a) => (
                <RowActions
                    onEditar={() => setEditando(a)}
                    onExcluir={() => setExcluindo(a)}
                    extras={a.ativo && !a.padrao ? [{ rotulo: 'Tornar padrão', tom: 'verde', icon: FaStar, onClick: () => tornarPadrao.mutate(a.id) }] : []}
                />
            ),
        },
    ];

    const colunasCnaes = [
        {
            key: 'codigo',
            header: 'CNAE',
            render: (c) => (
                <div>
                    <strong>{c.codigoFormatado}</strong>{' '}
                    {c.principal && <Badge $tone="info">Principal</Badge>}
                </div>
            ),
        },
        { key: 'descricao', header: 'Descrição', render: (c) => c.descricao },
        { key: 'item', header: 'Item sugerido', render: (c) => c.itemListaSugerido || '—' },
        { key: 'obs', header: 'Observação', render: (c) => <Muted>{c.observacao || ''}</Muted> },
        { key: 'qtd', header: 'Atividades', render: (c) => c.atividades },
        {
            key: 'acoes',
            header: '',
            render: (c) => (
                <RowActions
                    onEditar={() => setCnaeEditando(c)}
                    onExcluir={() => setCnaeExcluindo(c)}
                    extras={[
                        {
                            rotulo: 'Criar atividade deste CNAE',
                            tom: 'azul',
                            icon: FaPlus,
                            onClick: () => {
                                setAba('atividades');
                                setEditando({ inicial: { codigoCnae: c.codigo, descricao: '', itemListaServico: c.itemListaSugerido ?? '' } });
                            },
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                icon={FaListUl}
                tone="purple"
                title="Atividades de serviço"
                subtitle="Itens da lista, códigos de tributação, CNAEs e alíquotas usados na emissão de NFS-e."
                actions={
                    <>
                        <Button variant="secondary" icon={<FaFileInvoiceDollar />} onClick={() => navigate('/financeiro/fiscal')}>Voltar às notas</Button>
                        {aba === 'atividades' ? (
                            <>
                                <Button variant="secondary" icon={<FaMagic />} loading={classificar.isPending} onClick={() => classificar.mutate()}>Preencher IBS/CBS</Button>
                                <Button icon={<FaPlus />} onClick={() => setEditando('nova')}>Nova atividade</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" icon={<FaFileImport />} onClick={() => setImportando(true)}>Importar do cartão CNPJ</Button>
                                <Button icon={<FaPlus />} onClick={() => setCnaeEditando('novo')}>Adicionar CNAE</Button>
                            </>
                        )}
                    </>
                }
            />

            <Tabs
                tabs={[
                    { id: 'atividades', label: 'Atividades', icon: <FaListUl /> },
                    { id: 'cnaes', label: `CNAEs da empresa (${listaCnaes.length})`, icon: <FaFileInvoiceDollar /> },
                ]}
                value={aba}
                onChange={setAba}
            />

            {aba === 'atividades' && (
                <>
                    <Card>
                        <Grid $cols={3}>
                            <FilterInput
                                label="Buscar"
                                placeholder="Descrição, item da lista (07.02), código ou CNAE"
                                value={busca}
                                onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                            />
                            <FilterSelect
                                label="Origem"
                                placeholder="Todas"
                                value={origem}
                                onChange={(e) => { setOrigem(e.target.value); setPage(1); }}
                                options={[{ value: 'true', label: 'Só o que a empresa faz (CNAEs)' }, { value: 'false', label: 'Fora do cadastro de CNAEs' }]}
                            />
                            <FilterSelect
                                label="Situação"
                                placeholder="Todas"
                                value={situacao}
                                onChange={(e) => { setSituacao(e.target.value); setPage(1); }}
                                options={[{ value: 'true', label: 'Ativas' }, { value: 'false', label: 'Inativas' }]}
                            />
                        </Grid>
                    </Card>

                    {lista.error ? (
                        <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
                    ) : (
                        <Card>
                            <DataTable
                                loading={lista.isLoading}
                                rows={lista.data?.data}
                                columns={colunasAtividades}
                                onRowClick={setEditando}
                                emptyTitle="Nenhuma atividade encontrada"
                                emptyDescription="Crie atividades a partir dos CNAEs da empresa; a marcada como padrão já vem escolhida na nota."
                            />
                            {lista.data && <PaginationBar meta={lista.data.meta} onPageChange={setPage} label="atividades" />}
                        </Card>
                    )}
                </>
            )}

            {aba === 'cnaes' && (
                cnaes.error ? (
                    <ErrorBlock message={errorMessage(cnaes.error)} onRetry={cnaes.refetch} />
                ) : (
                    <Card>
                        <DataTable
                            loading={cnaes.isLoading}
                            rows={listaCnaes}
                            columns={colunasCnaes}
                            onRowClick={setCnaeEditando}
                            emptyTitle="Nenhum CNAE cadastrado"
                            emptyDescription="Importe do cartão CNPJ ou adicione manualmente."
                        />
                    </Card>
                )
            )}

            {editando && <AtividadeDialog registro={registro} inicial={inicial} cnaes={listaCnaes} onClose={() => setEditando(null)} />}
            {cnaeEditando && <CnaeDialog registro={cnaeEditando === 'novo' ? null : cnaeEditando} onClose={() => setCnaeEditando(null)} />}
            {importando && <ImportarCnaesDialog onClose={() => setImportando(false)} />}

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir atividade"
                message="Excluir esta atividade? Se ela já foi usada em notas, inative-a em vez de excluir."
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />
            <ConfirmDialog
                open={Boolean(cnaeExcluindo)}
                title="Remover CNAE"
                message="Remover este CNAE do cadastro? Só é possível se nenhuma atividade o usar."
                confirmLabel="Remover"
                danger
                loading={excluirCnae.isPending}
                onConfirm={() => excluirCnae.mutate(cnaeExcluindo.id)}
                onClose={() => setCnaeExcluindo(null)}
            />
        </Page>
    );
}
