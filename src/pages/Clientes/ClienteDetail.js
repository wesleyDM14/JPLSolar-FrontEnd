import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaBarcode, FaBuilding, FaEdit, FaFileAlt, FaFileContract, FaIdCard, FaMoneyBillWave, FaTrashAlt, FaUser } from 'react-icons/fa';
import { TbSolarPanel2 } from 'react-icons/tb';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { clientesApi, contratosApi, financeiroApi, usinasApi } from '../../api/resources';
import ClienteDialog from '../Financial/ClienteDialog';
import BoletoAvulsoDialog from '../Financial/boleto/BoletoAvulsoDialog';
import DocumentosPanel from '../../components/DocumentosPanel';
import { errorMessage } from '../../api/client';
import {
    Badge,
    Button,
    Card,
    CardTitle,
    ConfirmDialog,
    DataTable,
    DetalheHero,
    ErrorBlock,
    Grid,
    KeyValue,
    LoadingBlock,
    Muted,
    Page,
    PageHeader,
    Row,
    Tabs,
} from '../../ui';
import {
    estadoCivilOptions,
    generoOptions,
    inversorLabel,
    statusContratoLabel,
    statusContratoTone,
    tipoDocumentoOptions,
    tipoPessoaLabel,
    TIPO_PESSOA,
} from '../../utils/enums';
import { formatCurrency, formatDate, formatDocumento, formatPhone } from '../../utils/masks';

const labelOf = (options, value) => options.find((option) => option.value === value)?.label;

function DadosTab({ cliente }) {
    const pessoaFisica = cliente.tipoPessoa === TIPO_PESSOA.PESSOA_FISICA;
    const { endereco } = cliente;

    return (
        <>
            <Card>
                <CardTitle>Identificação</CardTitle>
                <Grid $cols={3}>
                    <KeyValue label="Tipo">{tipoPessoaLabel(cliente.tipoPessoa)}</KeyValue>
                    <KeyValue label={pessoaFisica ? 'CPF' : 'CNPJ'}>{cliente.documento && formatDocumento(cliente.documento)}</KeyValue>
                    <KeyValue label={pessoaFisica ? 'Nome' : 'Razão social'}>{cliente.nome}</KeyValue>
                    {!pessoaFisica && <KeyValue label="Nome fantasia">{cliente.nomeFantasia}</KeyValue>}
                    <KeyValue label="E-mail">{cliente.email}</KeyValue>
                    <KeyValue label="Telefone">{cliente.telefone && formatPhone(cliente.telefone)}</KeyValue>
                </Grid>
            </Card>

            <Card>
                <CardTitle>{pessoaFisica ? 'Dados pessoais' : 'Empresa e representante legal'}</CardTitle>
                {pessoaFisica ? (
                    <Grid $cols={3}>
                        <KeyValue label="RG">{cliente.rg}</KeyValue>
                        <KeyValue label="Data de nascimento">{formatDate(cliente.dataNascimento)}</KeyValue>
                        <KeyValue label="Profissão">{cliente.profissao}</KeyValue>
                        <KeyValue label="Estado civil">{labelOf(estadoCivilOptions, cliente.estadoCivil)}</KeyValue>
                        <KeyValue label="Gênero">{labelOf(generoOptions, cliente.genero)}</KeyValue>
                    </Grid>
                ) : (
                    <Grid $cols={3}>
                        <KeyValue label="Inscrição estadual">{cliente.inscricaoEstadual}</KeyValue>
                        <KeyValue label="Representante legal">{cliente.representanteNome}</KeyValue>
                        <KeyValue label="CPF do representante">{cliente.representanteCpf && formatDocumento(cliente.representanteCpf)}</KeyValue>
                        <KeyValue label="Cargo">{cliente.representanteCargo}</KeyValue>
                    </Grid>
                )}
            </Card>

            <Card>
                <CardTitle>Endereço</CardTitle>
                {endereco ? (
                    <Grid $cols={3}>
                        <KeyValue label="Logradouro">{`${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` - ${endereco.complemento}` : ''}`}</KeyValue>
                        <KeyValue label="Bairro">{endereco.bairro}</KeyValue>
                        <KeyValue label="Cidade / UF">{`${endereco.cidade} / ${endereco.uf}`}</KeyValue>
                        <KeyValue label="CEP">{endereco.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</KeyValue>
                    </Grid>
                ) : (
                    <Muted>Endereço não cadastrado.</Muted>
                )}
            </Card>

            {cliente.observacoes && (
                <Card>
                    <CardTitle>Observações</CardTitle>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{cliente.observacoes}</p>
                </Card>
            )}
        </>
    );
}

function UsinasTab({ clienteId }) {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['usinas', { clientId: clienteId }],
        queryFn: () => usinasApi.list({ clientId: clienteId, pageSize: 100 }),
    });

    return (
        <>
            <Row $justify="flex-end" style={{ marginBottom: 12 }}>
                <Button size="sm" onClick={() => navigate(`/usinas/nova?clienteId=${clienteId}`)}>Nova usina</Button>
            </Row>
            <DataTable
                loading={isLoading}
                rows={data?.data}
                emptyTitle="Nenhuma usina cadastrada para este cliente"
                onRowClick={(usina) => navigate(`/usinas/${usina.id}`)}
                columns={[
                    { key: 'code', header: 'Código', render: (u) => <strong>{u.code}</strong> },
                    { key: 'inversor', header: 'Inversor', render: (u) => inversorLabel(u.inversor) },
                    { key: 'installedPower', header: 'Potência', render: (u) => `${u.installedPower} kWp` },
                    { key: 'local', header: 'Local' },
                    { key: 'ativa', header: 'Situação', render: (u) => <Badge $tone={u.ativa ? 'success' : 'neutral'}>{u.ativa ? 'Ativa' : 'Inativa'}</Badge> },
                ]}
            />
        </>
    );
}

function ContratosTab({ clienteId }) {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['contratos', { clienteId }],
        queryFn: () => contratosApi.list({ clienteId, pageSize: 100 }),
    });

    return (
        <>
            <Row $justify="flex-end" style={{ marginBottom: 12 }}>
                <Button size="sm" onClick={() => navigate(`/contratos/novo?clienteId=${clienteId}`)}>Novo contrato</Button>
            </Row>
            <DataTable
                loading={isLoading}
                rows={data?.data}
                emptyTitle="Nenhum contrato para este cliente"
                onRowClick={(contrato) => navigate(`/contratos/${contrato.id}`)}
                columns={[
                    { key: 'dataContrato', header: 'Data', render: (c) => formatDate(c.dataContrato) },
                    { key: 'priceTotal', header: 'Valor', render: (c) => formatCurrency(c.priceTotal) },
                    { key: 'parcelas', header: 'Parcelas', render: (c) => `${c.quantParcelas}x ${formatCurrency(c.priceParcela)}` },
                    { key: 'status', header: 'Situação', render: (c) => <Badge $tone={statusContratoTone[c.status]}>{statusContratoLabel(c.status)}</Badge> },
                ]}
            />
        </>
    );
}

function DocumentosTab({ cliente }) {
    return <DocumentosPanel clienteId={cliente.id} tipos={tipoDocumentoOptions} defaultTipo="DOCUMENTO_PESSOAL" />;
}

export default function ClienteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('dados');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: cliente, isLoading, error, refetch } = useQuery({
        queryKey: ['cliente', id],
        queryFn: () => clientesApi.get(id),
    });

    const remove = useMutation({
        mutationFn: () => clientesApi.remove(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['clientes'] });
            toast.success('Cliente excluído.');
            navigate('/clientes');
        },
        onError: (err) => {
            setConfirmDelete(false);
            toast.error(errorMessage(err));
        },
    });

    const [painel, setPainel] = useState(false);
    const [avulso, setAvulso] = useState(false);
    const visao = useQuery({ queryKey: ['financeiro', 'cliente-visao', id], queryFn: () => financeiroApi.visaoCliente(id) });

    if (isLoading) return <Page><LoadingBlock /></Page>;
    if (error) return <Page><ErrorBlock message={errorMessage(error)} onRetry={refetch} /></Page>;

    const tabs = [
        { id: 'dados', label: 'Dados', icon: <FaIdCard /> },
        { id: 'usinas', label: `Usinas (${cliente._count.plants})`, icon: <TbSolarPanel2 /> },
        { id: 'contratos', label: `Contratos (${cliente._count.contratos})`, icon: <FaFileContract /> },
        { id: 'documentos', label: `Documentos (${cliente._count.documentos})`, icon: <FaFileAlt /> },
    ];

    const fin = visao.data?.financeiro;

    return (
        <Page>
            <PageHeader
                icon={cliente.tipoPessoa === 'PESSOA_JURIDICA' ? FaBuilding : FaUser}
                tone="blue"
                title="Cliente"
                subtitle="Cadastro, usinas, contratos, documentos e financeiro."
                actions={
                    <>
                        <Button variant="secondary" onClick={() => navigate('/clientes')}>Voltar</Button>
                        <Button variant="secondary" icon={<FaMoneyBillWave />} onClick={() => setPainel(true)}>Financeiro</Button>
                        <Button variant="secondary" icon={<FaBarcode />} onClick={() => setAvulso(true)}>Gerar boletos</Button>
                        <Button variant="secondary" icon={<FaEdit />} onClick={() => navigate(`/clientes/${id}/editar`)}>Editar</Button>
                        <Button variant="danger" icon={<FaTrashAlt />} onClick={() => setConfirmDelete(true)}>Excluir</Button>
                    </>
                }
            />

            <DetalheHero
                nome={cliente.nome}
                avatar
                chips={
                    <>
                        <Badge $tone="info">{tipoPessoaLabel(cliente.tipoPessoa)}</Badge>
                        {cliente.documento && <Badge>{formatDocumento(cliente.documento)}</Badge>}
                        {cliente.telefone && <Badge>{formatPhone(cliente.telefone)}</Badge>}
                        {cliente.endereco && <Badge>{cliente.endereco.cidade}/{cliente.endereco.uf}</Badge>}
                    </>
                }
                indicadores={[
                    { rotulo: 'Usinas', valor: cliente._count.plants },
                    { rotulo: 'Contratos', valor: cliente._count.contratos },
                    { rotulo: 'Em aberto', valor: fin ? formatCurrency(fin.emAberto) : '—' },
                    { rotulo: 'Vencido', valor: fin ? formatCurrency(fin.vencido) : '—', cor: fin?.vencido > 0 ? 'var(--c-danger)' : undefined },
                ]}
            />

            <Tabs tabs={tabs} value={tab} onChange={setTab} />

            {tab === 'dados' && <DadosTab cliente={cliente} />}
            {tab === 'usinas' && <UsinasTab clienteId={id} />}
            {tab === 'contratos' && <ContratosTab clienteId={id} />}
            {tab === 'documentos' && <DocumentosTab cliente={cliente} />}

            {painel && <ClienteDialog clienteId={id} onClose={() => setPainel(false)} />}
            <BoletoAvulsoDialog open={avulso} cliente={{ id, nome: cliente.nome, documento: cliente.documento }} onClose={() => setAvulso(false)} />

            <ConfirmDialog
                open={confirmDelete}
                title="Excluir cliente"
                message={`Excluir "${cliente.nome}"? Clientes com usinas ou contratos não podem ser excluídos.`}
                confirmLabel="Excluir"
                danger
                loading={remove.isPending}
                onConfirm={() => remove.mutate()}
                onClose={() => setConfirmDelete(false)}
            />
        </Page>
    );
}
