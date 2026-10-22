import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaExclamationTriangle, FaPen, FaPlus, FaTrash, FaWrench } from 'react-icons/fa';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { muckApi } from '../../api/resources';
import ParteField from '../../components/ParteField';
import { Badge, Button, Card, CardTitle, ConfirmDialog, DataTable, DateField, Dialog, ErrorBlock, FilterSelect, Grid, Muted, Page, PageHeader, Row, SelectField, StatCard, StatGrid, TextField, TextareaField } from '../../ui';
import { hojeIso } from '../../utils/datas';
import { formatDate } from '../../utils/masks';
import { brl, COBRANCA } from './format';

const schema = Yup.object({
    veiculoId: Yup.string().required('Escolha o veículo'),
    data: Yup.string().required('Informe a data'),
    tipo: Yup.string().required('Escolha o tipo'),
    descricao: Yup.string().trim().required('Descreva o que foi feito'),
    valor: Yup.number().typeError('Informe o valor').min(0),
});

const dataInput = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : '');

function ManutencaoDialog({ open, manutencao, veiculos, tipos, onClose }) {
    const queryClient = useQueryClient();
    const editando = Boolean(manutencao);

    const salvar = useMutation({
        mutationFn: (payload) => (editando ? muckApi.atualizarManutencao(manutencao.id, payload) : muckApi.criarManutencao(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success(editando ? 'Manutenção atualizada.' : 'Manutenção registrada.');
            onClose();
        },
    });

    if (!open) return null;

    const valores = {
        veiculoId: manutencao?.veiculo.id ?? veiculos[0]?.id ?? '',
        data: manutencao ? dataInput(manutencao.data) : hojeIso(),
        tipo: manutencao?.tipo ?? 'PREVENTIVA',
        descricao: manutencao?.descricao ?? '',
        valor: manutencao?.valor ?? '',
        fornecedorId: manutencao?.fornecedor?.id ?? '',
        horimetro: manutencao?.horimetro ?? '',
        proximaData: dataInput(manutencao?.proximaData),
        proximoHorimetro: manutencao?.proximoHorimetro ?? '',
        dataVencimento: dataInput(manutencao?.dataVencimento),
    };

    const enviar = async (v, { setErrors }) => {
        const vazio = (x) => (x === '' ? undefined : x);
        const payload = {
            veiculoId: v.veiculoId,
            data: v.data,
            tipo: v.tipo,
            descricao: v.descricao.trim(),
            valor: v.valor === '' ? 0 : Number(v.valor),
            fornecedorId: vazio(v.fornecedorId),
            horimetro: vazio(v.horimetro),
            proximaData: vazio(v.proximaData),
            proximoHorimetro: vazio(v.proximoHorimetro),
            dataVencimento: vazio(v.dataVencimento),
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
        <Formik initialValues={valores} validationSchema={schema} onSubmit={enviar}>
            {({ values, isSubmitting }) => (
                <Dialog open={open} width={700} onClose={onClose} title={editando ? 'Editar manutenção' : 'Nova manutenção ou despesa'}>
                    <Form noValidate id="muck-manutencao-form">
                        <Grid $cols={3}>
                            <SelectField name="veiculoId" label="Veículo" required options={veiculos.map((v) => ({ value: v.id, label: v.nome }))} />
                            <DateField name="data" label="Data" required />
                            <SelectField name="tipo" label="Tipo" required options={tipos.map((t) => ({ value: t.valor, label: t.nome }))} />
                        </Grid>
                        <TextareaField name="descricao" label="O que foi feito" required rows={2} placeholder="Ex.: troca de óleo do motor e filtros" />
                        <Grid $cols={2}>
                            <TextField name="valor" label="Valor (R$)" type="number" step="0.01" min="0" hint="Deixe em branco se não teve custo." />
                            <ParteField name="fornecedorId" parte="fornecedor" label="Fornecedor / oficina" selecionadoInicial={manutencao?.fornecedor} permitirCadastro />
                        </Grid>
                        <div style={{ border: '1px solid var(--c-border)', borderRadius: 10, padding: 12, margin: '4px 0 12px' }}>
                            <strong>Pagamento</strong>
                            <Grid $cols={2}>
                                <DateField
                                    name="dataVencimento"
                                    label="Vencimento"
                                    hint={Number(values.valor) > 0 ? 'Coloque a data de vencimento para já aparecer em contas a pagar. Sem data, fica só no histórico.' : 'Sem valor, não cria conta a pagar.'}
                                />
                                <span />
                            </Grid>
                        </div>
                        <div style={{ border: '1px solid var(--c-border)', borderRadius: 10, padding: 12 }}>
                            <strong>Lembrete da próxima revisão</strong>
                            <Grid $cols={3}>
                                <TextField name="horimetro" label="Horas do motor agora" type="number" step="0.1" min="0" />
                                <DateField name="proximaData" label="Próxima revisão em" />
                                <TextField name="proximoHorimetro" label="Ou quando o motor marcar" type="number" step="0.1" min="0" />
                            </Grid>
                        </div>
                    </Form>
                    <Row $justify="flex-end" style={{ marginTop: 20 }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" form="muck-manutencao-form" loading={isSubmitting || salvar.isPending}>Salvar</Button>
                    </Row>
                </Dialog>
            )}
        </Formik>
    );
}

export default function Manutencao() {
    const queryClient = useQueryClient();
    const [veiculoId, setVeiculoId] = useState('');
    const [tipo, setTipo] = useState('');
    const [editando, setEditando] = useState(null);
    const [novo, setNovo] = useState(false);
    const [excluindo, setExcluindo] = useState(null);

    const veiculos = useQuery({ queryKey: ['muck', 'veiculos'], queryFn: muckApi.veiculos });
    const tipos = useQuery({ queryKey: ['muck', 'tipos'], queryFn: muckApi.tiposManutencao, staleTime: Infinity });
    const lista = useQuery({ queryKey: ['muck', 'manutencoes', veiculoId, tipo], queryFn: () => muckApi.manutencoes({ veiculoId, tipo }) });
    const painel = useQuery({ queryKey: ['muck', 'painel', 'revisoes', veiculoId], queryFn: () => muckApi.painel({ veiculoId }) });

    const excluir = useMutation({
        mutationFn: (id) => muckApi.excluirManutencao(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
            toast.success('Manutenção excluída.');
            setExcluindo(null);
        },
        onError: (erro) => {
            toast.error(errorMessage(erro));
            setExcluindo(null);
        },
    });

    const linhas = lista.data ?? [];
    const total = linhas.reduce((s, m) => s + m.valor, 0);
    const revisoes = painel.data?.revisoes ?? [];
    const horimetro = (veiculos.data ?? []).find((v) => !veiculoId || v.id === veiculoId)?.horimetroEstimado;

    const colunas = [
        { key: 'data', header: 'Data', nowrap: true, render: (m) => formatDate(m.data) },
        { key: 'tipo', header: 'Tipo', nowrap: true, render: (m) => <Badge $tone="neutral">{m.tipoNome}</Badge> },
        {
            key: 'descricao',
            header: 'O que foi feito',
            minWidth: 260,
            render: (m) => (
                <div>
                    {m.descricao}
                    <div><Muted style={{ fontSize: '0.82rem' }}>{[m.fornecedor?.nome, m.horimetro !== null ? `${m.horimetro} h` : null].filter(Boolean).join(' · ')}</Muted></div>
                </div>
            ),
        },
        { key: 'valor', header: 'Valor', nowrap: true, render: (m) => (m.valor > 0 ? <strong>{brl(m.valor)}</strong> : '—') },
        {
            key: 'pagar',
            header: 'Pagamento',
            nowrap: true,
            render: (m) => {
                if (!m.situacao) return <Muted>sem cobrança</Muted>;
                const info = COBRANCA[m.situacao] ?? COBRANCA.ABERTO;
                return <Badge $tone={m.situacao === 'PAGO' ? 'success' : info.tone}>{m.situacao === 'PAGO' ? 'Pago' : info.label}</Badge>;
            },
        },
        {
            key: 'proxima',
            header: 'Próxima revisão',
            nowrap: true,
            render: (m) => [m.proximaData ? formatDate(m.proximaData) : null, m.proximoHorimetro !== null ? `${m.proximoHorimetro} h` : null].filter(Boolean).join(' / ') || '—',
        },
        {
            key: 'acoes',
            header: '',
            nowrap: true,
            render: (m) => (
                <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => setEditando(m)}><FaPen /></Button>
                    <Button size="sm" variant="ghost" aria-label="Excluir" title="Excluir" onClick={() => setExcluindo(m)}><FaTrash /></Button>
                </div>
            ),
        },
    ];

    return (
        <Page>
            <PageHeader
                title="Manutenção do caminhão"
                subtitle="Tudo que foi gasto no caminhão. Quando tem valor e vencimento, já vai para contas a pagar."
                icon={FaWrench}
                actions={<Button icon={<FaPlus />} onClick={() => setNovo(true)} disabled={!veiculos.data?.length}>Nova manutenção</Button>}
            />

            {!veiculos.isLoading && !veiculos.data?.length && (
                <Card><Muted>Antes de registrar manutenção, cadastre o caminhão em “Veículo e motoristas”.</Muted></Card>
            )}

            <StatGrid style={{ margin: '16px 0' }}>
                <StatCard rotulo="Gasto (o que está na tela)" valor={brl(total)} tom="red" />
                <StatCard rotulo="Horímetro estimado" valor={horimetro === null || horimetro === undefined ? '—' : `${horimetro.toLocaleString('pt-BR')} h`} detalhe="última anotação + horas trabalhadas desde então" tom="blue" />
                <StatCard rotulo="Revisões para ficar de olho" valor={String(revisoes.length)} tom={revisoes.some((r) => r.situacao === 'VENCIDA') ? 'red' : revisoes.length ? 'orange' : 'green'} />
            </StatGrid>

            {revisoes.length > 0 && (
                <Card style={{ marginBottom: 16 }}>
                    <CardTitle>Revisões para ficar de olho</CardTitle>
                    {revisoes.map((r) => (
                        <div key={r.manutencaoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0' }}>
                            <span><strong>{r.tipo}</strong> <Muted>· {r.motivo}</Muted></span>
                            <Badge $tone={r.situacao === 'VENCIDA' ? 'danger' : 'warning'}><FaExclamationTriangle /> {r.situacao === 'VENCIDA' ? 'Vencida' : 'Em breve'}</Badge>
                        </div>
                    ))}
                </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                <FilterSelect label="Veículo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} options={(veiculos.data ?? []).map((v) => ({ value: v.id, label: v.nome }))} />
                <FilterSelect label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} options={(tipos.data ?? []).map((t) => ({ value: t.valor, label: t.nome }))} />
            </div>

            {lista.isError ? (
                <ErrorBlock message={errorMessage(lista.error)} onRetry={lista.refetch} />
            ) : (
                <DataTable columns={colunas} rows={linhas} loading={lista.isLoading} emptyTitle="Nenhuma manutenção registrada" emptyDescription="Anote aqui troca de óleo, pneus, revisões, seguro, IPVA e qualquer outro gasto do caminhão." onRowClick={setEditando} />
            )}

            <ManutencaoDialog
                open={novo || Boolean(editando)}
                manutencao={editando}
                veiculos={veiculos.data ?? []}
                tipos={tipos.data ?? []}
                onClose={() => { setNovo(false); setEditando(null); }}
            />

            <ConfirmDialog
                open={Boolean(excluindo)}
                title="Excluir esta manutenção?"
                message={excluindo?.situacao ? 'A conta a pagar ligada a ela também será cancelada.' : 'O registro sai do histórico.'}
                confirmLabel="Excluir"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(excluindo.id)}
                onClose={() => setExcluindo(null)}
            />
        </Page>
    );
}
