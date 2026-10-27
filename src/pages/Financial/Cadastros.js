import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Button, ConfirmDialog, DataTable, Dialog, ErrorBlock, Grid, Muted, Row, SelectField, Tabs, TextField, TextareaField } from '../../ui';
import { formatDocumento, formatPhone } from '../../utils/masks';
import { brl } from './format';

/**
 * CRUD genérico: lista + diálogo de formulário + confirmação de exclusão.
 * `config` descreve consulta, mutações e campos de cada cadastro.
 */
function Crud({ titulo, queryKey, listar, criar, atualizar, remover, colunas, campos, schema, inicial, paraPayload, vazio, rotuloNovo }) {
    const queryClient = useQueryClient();
    const [editando, setEditando] = useState(null); // objeto | 'novo'
    const [excluindo, setExcluindo] = useState(null);

    const lista = useQuery({ queryKey, queryFn: listar });

    const salvar = useMutation({
        mutationFn: ({ id, payload }) => (id ? atualizar(id, payload) : criar(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey });
            // Telas que usam estes cadastros em listas suspensas.
            await queryClient.invalidateQueries({ queryKey: ['contas-financeiras'] });
            await queryClient.invalidateQueries({ queryKey: ['categorias'] });
            await queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Salvo.');
            setEditando(null);
        },
    });

    const excluir = useMutation({
        mutationFn: (id) => remover(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Excluído.');
            setExcluindo(null);
        },
        onError: (erro) => {
            setExcluindo(null);
            toast.error(errorMessage(erro));
        },
    });

    if (lista.error) return <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />;

    const registro = editando && editando !== 'novo' ? editando : null;

    return (
        <>
            <Row $justify="space-between" style={{ marginBottom: 12 }}>
                <Muted>{titulo}</Muted>
                <Button onClick={() => setEditando('novo')}>{rotuloNovo}</Button>
            </Row>

            <DataTable
                loading={lista.isLoading}
                rows={lista.data}
                emptyTitle={vazio}
                onRowClick={setEditando}
                columns={[
                    ...colunas,
                    {
                        key: 'acoes',
                        header: '',
                        render: (linha) => (
                            <Button size="sm" variant="ghost" onClick={(evento) => { evento.stopPropagation(); setExcluindo(linha); }}>
                                Excluir
                            </Button>
                        ),
                    },
                ]}
            />

            {editando && (
                <Formik
                    initialValues={inicial(registro)}
                    validationSchema={schema}
                    onSubmit={async (values, { setErrors }) => {
                        try {
                            await salvar.mutateAsync({ id: registro?.id, payload: paraPayload(values, Boolean(registro)) });
                        } catch (erro) {
                            const detalhes = fieldErrors(erro);
                            if (Object.keys(detalhes).length > 0) setErrors(detalhes);
                            else toast.error(errorMessage(erro));
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Dialog open width={560} onClose={() => setEditando(null)} title={registro ? 'Editar' : rotuloNovo}>
                            <Form noValidate id="cadastro-form">{campos}</Form>
                            <Row $justify="flex-end" style={{ marginTop: 20 }}>
                                <Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
                                <Button type="submit" form="cadastro-form" loading={isSubmitting}>Salvar</Button>
                            </Row>
                        </Dialog>
                    )}
                </Formik>
            )}

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir cadastro"
                message="Excluir este registro? Se ele já foi usado em lançamentos, desative-o em vez de excluir."
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />
        </>
    );
}

const AtivoCampo = ({ nome = 'ativa', rotulo = 'Ativa' }) => (
    <SelectField
        name={nome}
        label="Situação"
        options={[{ value: 'true', label: rotulo }, { value: 'false', label: 'Inativa' }]}
        placeholder="Selecione"
    />
);

const GRUPOS_DRE = [
    { value: 'RECEITA_BRUTA', label: 'Receita bruta' },
    { value: 'DEDUCOES', label: 'Deduções e impostos sobre vendas' },
    { value: 'CUSTOS', label: 'Custos dos serviços e produtos' },
    { value: 'DESPESAS_OPERACIONAIS', label: 'Despesas operacionais' },
    { value: 'RECEITAS_FINANCEIRAS', label: 'Receitas financeiras' },
    { value: 'DESPESAS_FINANCEIRAS', label: 'Despesas financeiras' },
    { value: 'IMPOSTOS_LUCRO', label: 'Impostos sobre o lucro (IRPJ/CSLL)' },
    { value: 'FORA_DO_RESULTADO', label: 'Fora do resultado (empréstimos e investimentos)' },
];

const paraBooleano = (valor) => valor === true || valor === 'true';

function ContasFinanceiras() {
    return (
        <Crud
            titulo="Contas bancárias e caixas usadas nas baixas. O saldo é calculado pelo saldo inicial + movimentações."
            queryKey={['contas-financeiras']}
            listar={financeiroApi.contasFinanceiras}
            criar={financeiroApi.createContaFinanceira}
            atualizar={financeiroApi.updateContaFinanceira}
            remover={financeiroApi.removeContaFinanceira}
            vazio="Nenhuma conta cadastrada"
            rotuloNovo="Nova conta"
            colunas={[
                { key: 'nome', header: 'Conta', render: (c) => <strong>{c.nome}</strong> },
                { key: 'tipo', header: 'Tipo', render: (c) => (c.tipo === 'CAIXA' ? 'Caixa' : 'Banco') },
                { key: 'saldoInicial', header: 'Saldo inicial', render: (c) => brl(c.saldoInicial) },
                { key: 'saldo', header: 'Saldo atual', render: (c) => <strong>{brl(c.saldo)}</strong> },
                { key: 'ativa', header: 'Situação', render: (c) => (c.ativa ? <Badge $tone="success">Ativa</Badge> : <Badge>Inativa</Badge>) },
            ]}
            schema={Yup.object({ nome: Yup.string().trim().required('Informe o nome') })}
            inicial={(c) => ({
                nome: c?.nome ?? '',
                tipo: c?.tipo ?? 'BANCO',
                banco: '',
                agencia: '',
                numero: '',
                saldoInicial: c?.saldoInicial ?? 0,
                ativa: String(c?.ativa ?? true),
            })}
            paraPayload={(v, edicao) => ({
                nome: v.nome.trim(),
                tipo: v.tipo,
                saldoInicial: Number(v.saldoInicial) || 0,
                ativa: paraBooleano(v.ativa),
                ...(edicao ? {} : { banco: v.banco || undefined, agencia: v.agencia || undefined, numero: v.numero || undefined }),
            })}
            campos={(
                <>
                    <TextField name="nome" label="Nome" required autoFocus />
                    <Grid $cols={2}>
                        <SelectField name="tipo" label="Tipo" options={[{ value: 'BANCO', label: 'Conta bancária' }, { value: 'CAIXA', label: 'Caixa' }]} placeholder="Selecione" />
                        <TextField name="saldoInicial" label="Saldo inicial (R$)" type="number" step="0.01" />
                    </Grid>
                    <Grid $cols={3}>
                        <TextField name="banco" label="Banco" />
                        <TextField name="agencia" label="Agência" />
                        <TextField name="numero" label="Conta" />
                    </Grid>
                    <AtivoCampo />
                </>
            )}
        />
    );
}

function Categorias() {
    return (
        <Crud
            titulo="Classificação das receitas e despesas, usada nos filtros e agrupamentos."
            queryKey={['categorias', 'todas']}
            listar={() => financeiroApi.categorias({})}
            criar={financeiroApi.createCategoria}
            atualizar={financeiroApi.updateCategoria}
            remover={financeiroApi.removeCategoria}
            vazio="Nenhuma categoria"
            rotuloNovo="Nova categoria"
            colunas={[
                { key: 'nome', header: 'Categoria', render: (c) => <strong>{c.nome}</strong> },
                { key: 'tipo', header: 'Tipo', render: (c) => (c.tipo === 'RECEBER' ? <Badge $tone="success">Receita</Badge> : <Badge $tone="danger">Despesa</Badge>) },
                { key: 'grupo', header: 'Entra no DRE como', render: (c) => (c.grupoDre ? GRUPOS_DRE.find((g) => g.value === c.grupoDre)?.label : <Muted>Padrão ({c.tipo === 'RECEBER' ? 'receita bruta' : 'despesa operacional'})</Muted>) },
                { key: 'ativa', header: 'Situação', render: (c) => (c.ativa ? 'Ativa' : <Muted>Inativa</Muted>) },
            ]}
            schema={Yup.object({ nome: Yup.string().trim().required('Informe o nome') })}
            inicial={(c) => ({ nome: c?.nome ?? '', tipo: c?.tipo ?? 'PAGAR', ativa: String(c?.ativa ?? true), grupoDre: c?.grupoDre ?? '' })}
            paraPayload={(v, edicao) => ({ nome: v.nome.trim(), ativa: paraBooleano(v.ativa), grupoDre: v.grupoDre || null, ...(edicao ? {} : { tipo: v.tipo }) })}
            campos={(
                <>
                    <TextField name="nome" label="Nome" required autoFocus />
                    <SelectField name="tipo" label="Tipo" options={[{ value: 'RECEBER', label: 'Receita (a receber)' }, { value: 'PAGAR', label: 'Despesa (a pagar)' }]} placeholder="Selecione" />
                    <SelectField name="grupoDre" label="Onde entra no DRE" options={GRUPOS_DRE} placeholder="Padrão do tipo" hint="Linha do DRE em que esta categoria entra." />
                    <AtivoCampo />
                </>
            )}
        />
    );
}

function Fornecedores() {
    return (
        <Crud
            titulo="Quem recebe os seus pagamentos: fornecedores, prestadores e parceiros."
            queryKey={['fornecedores', 'todos']}
            listar={() => financeiroApi.fornecedores({})}
            criar={financeiroApi.createFornecedor}
            atualizar={financeiroApi.updateFornecedor}
            remover={financeiroApi.removeFornecedor}
            vazio="Nenhum fornecedor cadastrado"
            rotuloNovo="Novo fornecedor"
            colunas={[
                { key: 'nome', header: 'Fornecedor', render: (f) => <strong>{f.nome}</strong> },
                { key: 'documento', header: 'CPF/CNPJ', render: (f) => (f.documento ? formatDocumento(f.documento) : <Muted>—</Muted>) },
                { key: 'telefone', header: 'Telefone', render: (f) => (f.telefone ? formatPhone(f.telefone) : <Muted>—</Muted>) },
                { key: 'ativo', header: 'Situação', render: (f) => (f.ativo ? 'Ativo' : <Muted>Inativo</Muted>) },
            ]}
            schema={Yup.object({ nome: Yup.string().trim().required('Informe o nome') })}
            inicial={(f) => ({
                nome: f?.nome ?? '',
                documento: f?.documento ?? '',
                telefone: f?.telefone ?? '',
                email: f?.email ?? '',
                observacoes: f?.observacoes ?? '',
                ativo: String(f?.ativo ?? true),
            })}
            paraPayload={(v) => ({
                nome: v.nome.trim(),
                documento: v.documento || undefined,
                telefone: v.telefone || undefined,
                email: v.email || undefined,
                observacoes: v.observacoes || undefined,
                ativo: paraBooleano(v.ativo),
            })}
            campos={(
                <>
                    <TextField name="nome" label="Nome" required autoFocus />
                    <Grid $cols={2}>
                        <TextField name="documento" label="CPF/CNPJ" mask="documento" />
                        <TextField name="telefone" label="Telefone" mask="phone" />
                    </Grid>
                    <TextField name="email" label="E-mail" type="email" />
                    <TextareaField name="observacoes" label="Observações" rows={2} />
                    <AtivoCampo nome="ativo" rotulo="Ativo" />
                </>
            )}
        />
    );
}

export default function Cadastros() {
    const [aba, setAba] = useState('contas');

    return (
        <>
            <Tabs
                tabs={[
                    { id: 'contas', label: 'Contas' },
                    { id: 'categorias', label: 'Categorias' },
                    { id: 'fornecedores', label: 'Fornecedores' },
                ]}
                value={aba}
                onChange={setAba}
            />
            {aba === 'contas' && <ContasFinanceiras />}
            {aba === 'categorias' && <Categorias />}
            {aba === 'fornecedores' && <Fornecedores />}
        </>
    );
}
