import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaPlug, FaPlus, FaUniversity } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { bancosApi } from '../../api/resources';
import { Badge, Button, ConfirmDialog, Dialog, ErrorBlock, FilterInput, FilterSelect, LoadingBlock, Muted, Page, PageHeader, Reveal, Row, tokens } from '../../ui';
import Integracao from './Integracao';

const { colors } = tokens;

const Grade = styled.div`
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const Cartao = styled.article`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 16px;
    box-shadow: ${tokens.shadow};
    overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s;

    &::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 5px;
        background: ${({ $cor }) => $cor};
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
    }

    .topo {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo {
        flex: none;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: ${({ $cor }) => $cor};
        color: #fff;
        font-size: 22px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    }

    h3 {
        margin: 0;
        font-size: 1.02rem;
    }

    .meta {
        color: ${colors.muted};
        font-size: 0.86rem;
        display: grid;
        gap: 2px;
    }

    .acoes {
        margin-top: auto;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
`;

const Provedor = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 2px solid ${({ $ativo }) => ($ativo ? colors.primary : colors.border)};
    border-radius: 12px;
    background: ${colors.surface};
    color: ${colors.text};
    font-weight: 700;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, transform 0.15s;

    &:hover {
        transform: translateY(-1px);
        border-color: ${colors.primary};
    }

    span.bolinha {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${({ $cor }) => $cor};
    }
`;

const STATUS = {
    CONECTADO: { tom: 'success', rotulo: 'Conectado', icone: FaCheckCircle },
    PENDENTE: { tom: 'warning', rotulo: 'Credenciais salvas', icone: FaHourglassHalf },
    INCOMPLETA: { tom: 'danger', rotulo: 'Faltam credenciais', icone: FaExclamationCircle },
};

function statusDe(integracao) {
    if (integracao.origem === 'sicredi') return STATUS.CONECTADO;
    return STATUS[integracao.statusTeste] ?? STATUS.PENDENTE;
}

/** Bancos conectados: um cartão por banco, com teste de conexão e cadastro de novos bancos. */
export default function Bancos() {
    const queryClient = useQueryClient();
    const [novo, setNovo] = useState(false);
    const [editando, setEditando] = useState(null);
    const [sicredi, setSicredi] = useState(false);
    const [remover, setRemover] = useState(null);
    const [testando, setTestando] = useState('');

    const { data, isLoading, error, refetch } = useQuery({ queryKey: ['bancos'], queryFn: bancosApi.listar });

    const excluir = useMutation({
        mutationFn: (id) => bancosApi.remover(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['bancos'] });
            setRemover(null);
            toast.success('Banco removido.');
        },
        onError: (erro) => { setRemover(null); toast.error(errorMessage(erro)); },
    });

    const testar = async (integracao) => {
        setTestando(integracao.id);
        try {
            const resultado = await bancosApi.testar(integracao.id);
            await queryClient.invalidateQueries({ queryKey: ['bancos'] });
            (resultado.sucesso ? toast.success : toast)(resultado.mensagem);
        } catch (erro) {
            toast.error(errorMessage(erro));
        } finally {
            setTestando('');
        }
    };

    const catalogo = Object.fromEntries((data?.provedores ?? []).map((p) => [p.id, p]));

    return (
        <Page>
            <PageHeader
                icon={FaUniversity}
                tone="blue"
                title="Bancos"
                subtitle="Bancos da empresa para emitir cobranças e dar baixa nos pagamentos."
                actions={<Button icon={<FaPlus />} onClick={() => setNovo(true)}>Adicionar banco</Button>}
            />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : data.integracoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <p><strong>Nenhum banco conectado ainda.</strong></p>
                    <p><Muted>Cadastre o banco em que a empresa recebe para emitir boletos e conciliar pagamentos.</Muted></p>
                    <Button icon={<FaPlus />} onClick={() => setNovo(true)}>Adicionar banco</Button>
                </div>
            ) : (
                <Grade>
                    {data.integracoes.map((integracao, indice) => {
                        const info = catalogo[integracao.provedor];
                        const status = statusDe(integracao);
                        const Icone = status.icone;

                        return (
                            <Reveal key={integracao.id} $delay={indice * 50}>
                                <Cartao $cor={info?.cor ?? '#607D8B'}>
                                    <div className="topo">
                                        <div className="logo"><FaUniversity /></div>
                                        <div style={{ minWidth: 0 }}>
                                            <h3>{integracao.nome}</h3>
                                            <Badge $tone={status.tom}><Icone /> {status.rotulo}</Badge>
                                        </div>
                                    </div>
                                    <div className="meta">
                                        <span>{info?.nome ?? integracao.provedor} · {integracao.ambiente === 'PRODUCAO' ? 'Produção' : 'Ambiente de testes'}</span>
                                        {(integracao.agencia || integracao.conta) && <span>Ag. {integracao.agencia ?? '—'} · Conta {integracao.conta ?? '—'}</span>}
                                        {integracao.mensagemTeste && <span>{integracao.mensagemTeste}</span>}
                                        {!integracao.conectorPronto && <span><Badge $tone="neutral">Conector em preparação</Badge></span>}
                                    </div>
                                    <div className="acoes">
                                        <Button size="sm" variant="secondary" icon={<FaPlug />} loading={testando === integracao.id} onClick={() => testar(integracao)}>Testar conexão</Button>
                                        <Button size="sm" variant="secondary" onClick={() => (integracao.origem === 'sicredi' ? setSicredi(true) : setEditando(integracao))}>Editar</Button>
                                        {integracao.origem !== 'sicredi' && <Button size="sm" variant="ghost" onClick={() => setRemover(integracao)}>Remover</Button>}
                                    </div>
                                </Cartao>
                            </Reveal>
                        );
                    })}
                </Grade>
            )}

            {(novo || editando) && (
                <BancoDialog
                    provedores={data?.provedores ?? []}
                    integracao={editando}
                    onSicredi={() => { setNovo(false); setSicredi(true); }}
                    onClose={() => { setNovo(false); setEditando(null); }}
                />
            )}

            <Dialog open={sicredi} width={760} title="Conta de cobrança Sicredi" onClose={() => setSicredi(false)}>
                <Integracao />
            </Dialog>

            <ConfirmDialog
                open={Boolean(remover)}
                title="Remover banco"
                message={`Remover a conexão com "${remover?.nome ?? ''}"? As credenciais salvas serão apagadas.`}
                confirmLabel="Remover"
                danger
                loading={excluir.isPending}
                onConfirm={() => excluir.mutate(remover.id)}
                onClose={() => setRemover(null)}
            />
        </Page>
    );
}

function BancoDialog({ provedores, integracao, onSicredi, onClose }) {
    const queryClient = useQueryClient();
    const editando = Boolean(integracao);
    const [provedor, setProvedor] = useState(integracao?.provedor ?? '');
    const [dados, setDados] = useState({
        nome: integracao?.nome ?? '',
        agencia: integracao?.agencia ?? '',
        conta: integracao?.conta ?? '',
        codigoBeneficiario: integracao?.codigoBeneficiario ?? '',
        ambiente: integracao?.ambiente ?? 'SANDBOX',
    });
    const [credenciais, setCredenciais] = useState({});

    const catalogo = provedores.find((p) => p.id === provedor);

    const salvar = useMutation({
        mutationFn: () => {
            const payload = {
                provedor,
                nome: dados.nome || catalogo?.nome,
                agencia: dados.agencia || undefined,
                conta: dados.conta || undefined,
                codigoBeneficiario: dados.codigoBeneficiario || undefined,
                ambiente: dados.ambiente,
                credenciais,
            };
            return editando ? bancosApi.atualizar(integracao.id, payload) : bancosApi.criar(payload);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['bancos'] });
            toast.success('Banco salvo.');
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const escolher = (id) => {
        if (id === 'SICREDI') {
            onSicredi();
            return;
        }
        setProvedor(id);
        setDados((atual) => ({ ...atual, nome: atual.nome || provedores.find((p) => p.id === id)?.nome || '' }));
    };

    return (
        <Dialog
            open
            width={680}
            title={editando ? 'Editar banco' : 'Adicionar banco'}
            subtitle={editando ? undefined : 'Escolha o banco e informe as credenciais da API de cobrança.'}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button loading={salvar.isPending} disabled={!provedor} onClick={() => salvar.mutate()}>Salvar</Button>
                </>
            }
        >
            {!editando && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 18 }}>
                    {provedores.map((p) => (
                        <Provedor key={p.id} type="button" $ativo={provedor === p.id} $cor={p.cor} onClick={() => escolher(p.id)}>
                            <span className="bolinha" />
                            {p.nome}
                        </Provedor>
                    ))}
                </div>
            )}

            {provedor && (
                <div style={{ display: 'grid', gap: 12 }}>
                    <FilterInput label="Nome da conexão" value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} />
                    <Row $gap={12} $wrap={false}>
                        <div style={{ flex: 1 }}><FilterInput label="Agência" value={dados.agencia} onChange={(e) => setDados((d) => ({ ...d, agencia: e.target.value }))} /></div>
                        <div style={{ flex: 1 }}><FilterInput label="Conta" value={dados.conta} onChange={(e) => setDados((d) => ({ ...d, conta: e.target.value }))} /></div>
                        <div style={{ flex: 1 }}><FilterInput label="Convênio / beneficiário" value={dados.codigoBeneficiario} onChange={(e) => setDados((d) => ({ ...d, codigoBeneficiario: e.target.value }))} /></div>
                    </Row>
                    <FilterSelect
                        label="Ambiente"
                        placeholder={null}
                        value={dados.ambiente}
                        onChange={(e) => setDados((d) => ({ ...d, ambiente: e.target.value || 'SANDBOX' }))}
                        options={[{ value: 'SANDBOX', label: 'Testes (sandbox)' }, { value: 'PRODUCAO', label: 'Produção' }]}
                    />

                    {(catalogo?.campos ?? []).map((campo) => {
                        const preenchido = integracao?.camposPreenchidos?.includes(campo.id);
                        return (
                            <div key={campo.id}>
                                {campo.longo ? (
                                    <label style={{ display: 'grid', gap: 6 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{campo.rotulo}</span>
                                        <textarea
                                            rows={4}
                                            placeholder={preenchido ? 'Já salvo. Cole um novo valor para substituir.' : ''}
                                            value={credenciais[campo.id] ?? ''}
                                            onChange={(e) => setCredenciais((c) => ({ ...c, [campo.id]: e.target.value }))}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text)', fontFamily: 'monospace' }}
                                        />
                                    </label>
                                ) : (
                                    <FilterInput
                                        label={campo.rotulo}
                                        type={campo.segredo ? 'password' : 'text'}
                                        autoComplete="new-password"
                                        placeholder={preenchido ? '•••••••• (já salvo)' : ''}
                                        value={credenciais[campo.id] ?? ''}
                                        onChange={(e) => setCredenciais((c) => ({ ...c, [campo.id]: e.target.value }))}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {catalogo && !catalogo.conectorPronto && (
                        <Badge $tone="neutral">As credenciais ficam guardadas criptografadas. A emissão por este banco ainda não está disponível.</Badge>
                    )}
                </div>
            )}
        </Dialog>
    );
}
