import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaIdCard, FaPen, FaPlus, FaTruckMoving } from 'react-icons/fa';
import * as Yup from 'yup';
import { errorMessage, fieldErrors } from '../../api/client';
import { fiscalApi, muckApi } from '../../api/resources';
import { Badge, Button, Card, CardTitle, DataTable, Dialog, Grid, Muted, Page, PageHeader, Row, SelectField, TextField, TextareaField } from '../../ui';
import { brl } from './format';

const limpo = (valor) => (valor === '' || valor === null || valor === undefined ? undefined : valor);

function VeiculoDialog({ open, veiculo, motoristas, atividades, onClose }) {
    const queryClient = useQueryClient();
    const editando = Boolean(veiculo);

    const salvar = useMutation({
        mutationFn: (payload) => (editando ? muckApi.atualizarVeiculo(veiculo.id, payload) : muckApi.criarVeiculo(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            toast.success(editando ? 'Veículo atualizado.' : 'Veículo cadastrado.');
            onClose();
        },
    });

    if (!open) return null;

    const schema = Yup.object({
        nome: Yup.string().trim().required('Informe o nome do veículo'),
        valorHora: Yup.number().typeError('Informe o valor da hora').min(0).required('Informe o valor da hora'),
        prazoPagamentoDias: Yup.number().typeError('Informe o prazo').integer().min(0).max(365).required('Informe o prazo'),
    });

    const inicial = {
        nome: veiculo?.nome ?? 'Caminhão munck',
        placa: veiculo?.placa ?? '',
        modelo: veiculo?.modelo ?? '',
        ano: veiculo?.ano ?? '',
        valorHora: veiculo?.valorHora ?? '',
        prazoPagamentoDias: veiculo?.prazoPagamentoDias ?? 15,
        horimetroInicial: veiculo?.horimetroInicial ?? '',
        motoristaPadraoId: veiculo?.motoristaPadrao?.id ?? '',
        atividadeId: veiculo?.atividade?.id ?? '',
        ativo: veiculo?.ativo ?? true,
        observacoes: veiculo?.observacoes ?? '',
    };

    const enviar = async (v, { setErrors }) => {
        try {
            await salvar.mutateAsync({
                nome: v.nome.trim(),
                placa: limpo(v.placa),
                modelo: limpo(v.modelo),
                ano: limpo(v.ano),
                valorHora: Number(v.valorHora),
                prazoPagamentoDias: Number(v.prazoPagamentoDias),
                horimetroInicial: limpo(v.horimetroInicial),
                motoristaPadraoId: editando ? v.motoristaPadraoId || null : limpo(v.motoristaPadraoId),
                atividadeId: editando ? v.atividadeId || null : limpo(v.atividadeId),
                ativo: v.ativo,
                observacoes: limpo(v.observacoes),
            });
        } catch (erro) {
            const campos = fieldErrors(erro);
            if (Object.keys(campos).length > 0) setErrors(campos);
            else toast.error(errorMessage(erro));
        }
    };

    return (
        <Formik initialValues={inicial} validationSchema={schema} onSubmit={enviar}>
            {({ values, setFieldValue, isSubmitting }) => (
                <Dialog open={open} width={680} onClose={onClose} title={editando ? 'Editar veículo' : 'Novo veículo'}>
                    <Form noValidate id="muck-veiculo-form">
                        <Grid $cols={2}>
                            <TextField name="nome" label="Nome" required />
                            <TextField name="placa" label="Placa" />
                        </Grid>
                        <Grid $cols={2}>
                            <TextField name="modelo" label="Modelo" />
                            <TextField name="ano" label="Ano" type="number" min="1950" />
                        </Grid>
                        <Grid $cols={3}>
                            <TextField name="valorHora" label="Preço da hora (R$)" type="number" step="0.01" min="0" required hint="Mudar o preço não altera os serviços já lançados." />
                            <TextField name="prazoPagamentoDias" label="Prazo de pagamento (dias)" type="number" min="0" max="365" required hint="Quantos dias o cliente tem para pagar." />
                            <TextField name="horimetroInicial" label="Horas do motor hoje" type="number" step="0.1" min="0" hint="Opcional. O número que o relógio de horas do caminhão (horímetro) marca agora; serve para avisar a hora da revisão." />
                        </Grid>
                        <Grid $cols={2}>
                            <SelectField name="motoristaPadraoId" label="Motorista fixo" options={motoristas.filter((m) => m.ativo).map((m) => ({ value: m.id, label: m.nome }))} placeholder="Nenhum" />
                            <SelectField
                                name="atividadeId"
                                label="Tipo de serviço na nota fiscal"
                                options={atividades.map((a) => ({ value: a.id, label: `${a.itemListaServico} · ${a.descricao}` }))}
                                placeholder="Usar a atividade padrão"
                                hint="O tipo de serviço que sai na nota. Se não escolher, vale o padrão."
                            />
                        </Grid>
                        <TextareaField name="observacoes" label="Observações" rows={2} />
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                            <input type="checkbox" checked={values.ativo} onChange={(e) => setFieldValue('ativo', e.target.checked)} />
                            Ainda em uso (aparece ao lançar serviços)
                        </label>
                    </Form>
                    <Row $justify="flex-end" style={{ marginTop: 20 }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" form="muck-veiculo-form" loading={isSubmitting || salvar.isPending}>Salvar</Button>
                    </Row>
                </Dialog>
            )}
        </Formik>
    );
}

function MotoristaDialog({ open, motorista, onClose }) {
    const queryClient = useQueryClient();
    const editando = Boolean(motorista);

    const salvar = useMutation({
        mutationFn: (payload) => (editando ? muckApi.atualizarMotorista(motorista.id, payload) : muckApi.criarMotorista(payload)),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            toast.success(editando ? 'Motorista atualizado.' : 'Motorista cadastrado.');
            onClose();
        },
    });

    if (!open) return null;

    const schema = Yup.object({ nome: Yup.string().trim().required('Informe o nome') });
    const inicial = {
        nome: motorista?.nome ?? '',
        documento: motorista?.documento ?? '',
        telefone: motorista?.telefone ?? '',
        cnh: motorista?.cnh ?? '',
        custoHora: motorista?.custoHora ?? '',
        ativo: motorista?.ativo ?? true,
    };

    return (
        <Formik
            initialValues={inicial}
            validationSchema={schema}
            onSubmit={async (v, { setErrors }) => {
                try {
                    await salvar.mutateAsync({
                        nome: v.nome.trim(),
                        documento: limpo(v.documento),
                        telefone: limpo(v.telefone),
                        cnh: limpo(v.cnh),
                        custoHora: limpo(v.custoHora),
                        ativo: v.ativo,
                    });
                } catch (erro) {
                    const campos = fieldErrors(erro);
                    if (Object.keys(campos).length > 0) setErrors(campos);
                    else toast.error(errorMessage(erro));
                }
            }}
        >
            {({ values, setFieldValue, isSubmitting }) => (
                <Dialog open={open} width={560} onClose={onClose} title={editando ? 'Editar motorista' : 'Novo motorista'}>
                    <Form noValidate id="muck-motorista-form">
                        <TextField name="nome" label="Nome" required autoFocus />
                        <Grid $cols={2}>
                            <TextField name="documento" label="CPF" mask="cpf" />
                            <TextField name="telefone" label="Telefone" mask="phone" />
                        </Grid>
                        <Grid $cols={2}>
                            <TextField name="cnh" label="CNH" />
                            <TextField name="custoHora" label="Custo por hora (R$)" type="number" step="0.01" min="0" hint="Opcional. Quanto ele custa por hora, para ver o lucro de verdade." />
                        </Grid>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                            <input type="checkbox" checked={values.ativo} onChange={(e) => setFieldValue('ativo', e.target.checked)} />
                            Motorista ativo
                        </label>
                    </Form>
                    <Row $justify="flex-end" style={{ marginTop: 20 }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" form="muck-motorista-form" loading={isSubmitting || salvar.isPending}>Salvar</Button>
                    </Row>
                </Dialog>
            )}
        </Formik>
    );
}

/** Veículo (com o preço da hora) e motoristas. */
export default function Cadastros() {
    const [veiculo, setVeiculo] = useState(null);
    const [novoVeiculo, setNovoVeiculo] = useState(false);
    const [motorista, setMotorista] = useState(null);
    const [novoMotorista, setNovoMotorista] = useState(false);

    const veiculos = useQuery({ queryKey: ['muck', 'veiculos'], queryFn: muckApi.veiculos });
    const motoristas = useQuery({ queryKey: ['muck', 'motoristas'], queryFn: muckApi.motoristas });
    const atividades = useQuery({ queryKey: ['fiscal', 'atividades', 'ativas'], queryFn: () => fiscalApi.atividades({ ativo: 'true', pageSize: 100 }) });

    const colunasMotorista = [
        { key: 'nome', header: 'Nome', render: (m) => <strong>{m.nome}</strong> },
        { key: 'telefone', header: 'Telefone', render: (m) => m.telefone || '—' },
        { key: 'cnh', header: 'CNH', render: (m) => m.cnh || '—' },
        { key: 'custo', header: 'Custo/hora', render: (m) => (m.custoHora ? brl(m.custoHora) : '—') },
        { key: 'ativo', header: 'Situação', render: (m) => <Badge $tone={m.ativo ? 'success' : 'neutral'}>{m.ativo ? 'Ativo' : 'Inativo'}</Badge> },
        { key: 'a', header: '', render: (m) => <Button size="sm" variant="ghost" aria-label="Editar" onClick={(e) => { e.stopPropagation(); setMotorista(m); }}><FaPen /></Button> },
    ];

    return (
        <Page>
            <PageHeader title="Veículo e motoristas" subtitle="Preço da hora, prazo de pagamento e o motorista fixo do caminhão." icon={FaIdCard} />

            <Card>
                <Row $justify="space-between">
                    <CardTitle><FaTruckMoving /> Veículos</CardTitle>
                    <Button size="sm" icon={<FaPlus />} onClick={() => setNovoVeiculo(true)}>Novo veículo</Button>
                </Row>
                {(veiculos.data ?? []).length === 0 && !veiculos.isLoading && (
                    <p><Muted>Cadastre o caminhão com o preço da hora e já dá para lançar serviços.</Muted></p>
                )}
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {(veiculos.data ?? []).map((v) => (
                        <div key={v.id} style={{ border: '1px solid var(--c-border)', borderRadius: 12, padding: 14, display: 'grid', gap: 6 }}>
                            <Row $justify="space-between">
                                <strong>{v.nome}{v.placa ? ` · ${v.placa}` : ''}</strong>
                                <Badge $tone={v.ativo ? 'success' : 'neutral'}>{v.ativo ? 'Ativo' : 'Inativo'}</Badge>
                            </Row>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{brl(v.valorHora)} <Muted style={{ fontSize: '0.9rem', fontWeight: 400 }}>por hora</Muted></span>
                            <Muted>Cliente paga em {v.prazoPagamentoDias} dias · Motorista: {v.motoristaPadrao?.nome ?? 'ninguém definido'}</Muted>
                            <Muted>Na nota fiscal: {v.atividade ? `${v.atividade.itemListaServico} · ${v.atividade.descricao}` : 'tipo de serviço padrão'}</Muted>
                            {v.horimetroEstimado !== null && v.horimetroEstimado !== undefined && <Muted>Relógio de horas do motor (estimado): {v.horimetroEstimado.toLocaleString('pt-BR')} h</Muted>}
                            <div><Button size="sm" variant="secondary" icon={<FaPen />} onClick={() => setVeiculo(v)}>Editar</Button></div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <Row $justify="space-between">
                    <CardTitle>Motoristas</CardTitle>
                    <Button size="sm" icon={<FaPlus />} onClick={() => setNovoMotorista(true)}>Novo motorista</Button>
                </Row>
                <DataTable columns={colunasMotorista} rows={motoristas.data ?? []} loading={motoristas.isLoading} emptyTitle="Nenhum motorista cadastrado" onRowClick={setMotorista} />
            </Card>

            <VeiculoDialog
                open={novoVeiculo || Boolean(veiculo)}
                veiculo={veiculo}
                motoristas={motoristas.data ?? []}
                atividades={atividades.data?.data ?? []}
                onClose={() => { setNovoVeiculo(false); setVeiculo(null); }}
            />
            <MotoristaDialog open={novoMotorista || Boolean(motorista)} motorista={motorista} onClose={() => { setNovoMotorista(false); setMotorista(null); }} />
        </Page>
    );
}
