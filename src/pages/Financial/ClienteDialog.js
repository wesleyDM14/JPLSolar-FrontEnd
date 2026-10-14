import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Button, Dialog, ErrorBlock, LoadingBlock, Muted, Row, Tabs, tokens } from '../../ui';
import { statusContratoLabel, statusContratoTone, tipoContratoLabel, inversorLabel } from '../../utils/enums';
import { formatDate, formatDocumento, formatPhone } from '../../utils/masks';
import { tempoDesde, usinaStatus } from '../../utils/usinaStatus';
import BaixaDialog from './BaixaDialog';
import { brl, situacaoInfo } from './format';
import LancamentoDialog from './LancamentoDialog';
import LancamentoFormDialog from './LancamentoFormDialog';

const { colors } = tokens;

const Identidade = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;

    .avatar {
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, ${colors.primary}, #8e1d1d);
        color: #fff;
        font-weight: 700;
        font-size: 1.1rem;
        font-family: 'Montserrat', sans-serif;
    }

    .dados {
        min-width: 0;
        font-size: 0.9rem;
        color: ${colors.muted};
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
    }
`;

const Kpis = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
`;

const Kpi = styled.div`
    padding: 12px 14px;
    border-radius: 12px;
    background: ${({ $bg }) => $bg || colors.background};
    border: 1px solid ${({ $border }) => $border || colors.border};

    .label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: ${colors.muted};
    }

    .valor {
        margin-top: 2px;
        font-size: 1.2rem;
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
        color: ${({ $color }) => $color || colors.text};
        font-variant-numeric: tabular-nums;
    }

    .sub {
        font-size: 0.78rem;
        color: ${colors.muted};
    }
`;

const Lista = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Linha = styled.button`
    display: grid;
    grid-template-columns: 82px minmax(0, 1fr) auto auto;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${({ $tom }) => $tom};
    border-radius: 10px;
    cursor: pointer;
    color: ${colors.text};
    transition: box-shadow 0.15s, transform 0.15s;

    &:hover {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.09);
        transform: translateY(-1px);
    }

    .data {
        font-size: 0.85rem;
        font-variant-numeric: tabular-nums;
    }

    .titulo {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .valor {
        font-weight: 700;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr auto;

        .data {
            grid-column: 1 / -1;
        }

        > button {
            grid-column: 1 / -1;
        }
    }
`;

const UsinaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
`;

const UsinaCard = styled.button`
    text-align: left;
    padding: 14px;
    border: 1px solid ${colors.border};
    border-top: 4px solid ${({ $tom }) => $tom};
    border-radius: 12px;
    background: ${colors.surface};
    cursor: pointer;
    color: ${colors.text};
    transition: box-shadow 0.15s, transform 0.15s;

    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .topo {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .codigo {
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
    }

    .local {
        margin: 6px 0 10px;
        font-size: 0.85rem;
        color: ${colors.muted};
    }

    .medidas {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font-size: 0.82rem;

        strong {
            display: block;
            font-size: 1rem;
        }
    }

    .rodape {
        margin-top: 10px;
        font-size: 0.78rem;
        color: ${colors.muted};
    }
`;

const Progresso = styled.div`
    height: 8px;
    border-radius: 6px;
    background: ${colors.neutralBg};
    overflow: hidden;

    span {
        display: block;
        height: 100%;
        background: ${colors.success};
    }
`;

const TITULO_SECAO = styled.h3`
    margin: 18px 0 8px;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${colors.muted};
`;

const TONS = { success: colors.success, warning: colors.warning, danger: colors.danger, info: colors.info, neutral: 'var(--c-muted)' };

function iniciais(nome = '') {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '?') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

/**
 * Painel completo do cliente: situação financeira, usinas (com o estado do monitoramento) e contratos.
 * Aberto a partir do financeiro; cada item leva ao detalhe correspondente.
 */
export default function ClienteDialog({ clienteId, onClose }) {
    const navigate = useNavigate();
    const [aba, setAba] = useState(null);
    const [detalheId, setDetalheId] = useState(null);
    const [baixando, setBaixando] = useState(null);
    const [novo, setNovo] = useState(false);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'cliente-visao', clienteId],
        queryFn: () => financeiroApi.visaoCliente(clienteId),
        enabled: Boolean(clienteId),
    });

    // Abre na aba mais útil: financeiro se há pendências, senão usinas.
    useEffect(() => {
        if (data && aba === null) setAba(data.pendentes.length > 0 || data.usinas.length === 0 ? 'financeiro' : 'usinas');
    }, [data, aba]);

    if (!clienteId) return null;

    const irPara = (caminho) => {
        onClose();
        navigate(caminho);
    };

    const cliente = data?.cliente;
    const fin = data?.financeiro;

    return (
        <>
            <Dialog
                open
                width={900}
                onClose={onClose}
                title={cliente ? cliente.nome : 'Cliente'}
                subtitle={cliente ? (cliente.nomeFantasia ? `Nome fantasia: ${cliente.nomeFantasia}` : undefined) : undefined}
                footer={
                    cliente && (
                        <>
                            <Button variant="secondary" onClick={() => irPara(`/clientes/${clienteId}`)}>Abrir cadastro</Button>
                            <Button variant="secondary" onClick={() => irPara(`/financeiro/receber?clienteId=${clienteId}&clienteNome=${encodeURIComponent(cliente.nome)}&situacao=`)}>Ver todos no financeiro</Button>
                            <Button onClick={() => setNovo(true)}>Nova conta a receber</Button>
                        </>
                    )
                }
            >
                {isLoading && <LoadingBlock />}
                {error && <ErrorBlock message={errorMessage(error)} onRetry={refetch} />}

                {data && (
                    <>
                        <Identidade>
                            <div className="avatar" aria-hidden>{iniciais(cliente.nome)}</div>
                            <div className="dados">
                                <Badge $tone="info">{cliente.tipoPessoa === 'PESSOA_JURIDICA' ? 'Pessoa jurídica' : 'Pessoa física'}</Badge>
                                {cliente.documento && <span>{formatDocumento(cliente.documento)}</span>}
                                {cliente.telefone && <span>{formatPhone(cliente.telefone)}</span>}
                                {cliente.email && <span>{cliente.email}</span>}
                                {cliente.endereco && <span>{cliente.endereco.cidade}/{cliente.endereco.uf}</span>}
                            </div>
                        </Identidade>

                        <Kpis>
                            <Kpi $color={fin.emAberto > 0 ? colors.info : colors.text}>
                                <div className="label">Em aberto</div>
                                <div className="valor">{brl(fin.emAberto)}</div>
                                <div className="sub">{fin.quantidadeAberta} parcela(s)</div>
                            </Kpi>
                            <Kpi $color={fin.vencido > 0 ? colors.danger : colors.text} $bg={fin.vencido > 0 ? colors.dangerBg : undefined} $border={fin.vencido > 0 ? 'var(--c-danger)' : undefined}>
                                <div className="label">Vencido</div>
                                <div className="valor">{brl(fin.vencido)}</div>
                                <div className="sub">{fin.quantidadeVencida} parcela(s)</div>
                            </Kpi>
                            <Kpi $color={colors.success}>
                                <div className="label">Já recebido</div>
                                <div className="valor">{brl(fin.recebido)}</div>
                                <div className="sub">de {brl(fin.totalLancado)} lançados</div>
                            </Kpi>
                            <Kpi>
                                <div className="label">Boletos em aberto</div>
                                <div className="valor">{fin.boletosEmAberto}</div>
                                <div className="sub">{fin.proximoVencimento ? `próximo: ${formatDate(fin.proximoVencimento)}` : 'sem vencimento futuro'}</div>
                            </Kpi>
                        </Kpis>

                        <Tabs
                            tabs={[
                                { id: 'financeiro', label: `Financeiro (${data.pendentes.length})` },
                                { id: 'usinas', label: `Usinas (${data.usinas.length})` },
                                { id: 'contratos', label: `Contratos (${data.contratos.length})` },
                            ]}
                            value={aba ?? 'financeiro'}
                            onChange={setAba}
                        />

                        {aba === 'financeiro' && (
                            <>
                                {data.pendentes.length === 0 ? (
                                    <p><Muted>Nenhuma parcela em aberto. Tudo em dia.</Muted></p>
                                ) : (
                                    <Lista>
                                        {data.pendentes.map((item) => {
                                            const situacao = situacaoInfo(item.situacao, item.tipo);
                                            return (
                                                <Linha key={item.id} type="button" $tom={TONS[situacao.tone]} onClick={() => setDetalheId(item.id)}>
                                                    <span className="data">
                                                        {formatDate(item.dataVencimento)}
                                                        {item.situacao === 'ATRASADO' && <div style={{ color: colors.danger, fontSize: '0.74rem' }}>{item.diasAtraso}d de atraso</div>}
                                                    </span>
                                                    <span>
                                                        <div className="titulo">{item.descricao}</div>
                                                        <Row $gap={6} style={{ marginTop: 3 }}>
                                                            <Badge $tone={situacao.tone}>{situacao.label}</Badge>
                                                            {item.boleto && <Badge $tone="info">Boleto {item.boleto.nossoNumero}</Badge>}
                                                            {item.categoria && <Muted style={{ fontSize: '0.8rem' }}>{item.categoria.nome}</Muted>}
                                                        </Row>
                                                    </span>
                                                    <span className="valor">{brl(item.valorRestante)}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={(evento) => {
                                                            evento.stopPropagation();
                                                            setBaixando(item);
                                                        }}
                                                    >
                                                        Receber
                                                    </Button>
                                                </Linha>
                                            );
                                        })}
                                    </Lista>
                                )}

                                {data.recebidos.length > 0 && (
                                    <>
                                        <TITULO_SECAO>Últimos recebimentos</TITULO_SECAO>
                                        <Lista>
                                            {data.recebidos.map((item) => (
                                                <Linha key={item.id} type="button" $tom={colors.success} onClick={() => setDetalheId(item.id)}>
                                                    <span className="data">{formatDate(item.dataVencimento)}</span>
                                                    <span className="titulo">{item.descricao}</span>
                                                    <span className="valor">{brl(item.valorPago)}</span>
                                                    <Badge $tone="success">Recebido</Badge>
                                                </Linha>
                                            ))}
                                        </Lista>
                                    </>
                                )}
                            </>
                        )}

                        {aba === 'usinas' && (
                            data.usinas.length === 0 ? (
                                <p><Muted>Este cliente não tem usinas cadastradas.</Muted></p>
                            ) : (
                                <UsinaGrid>
                                    {data.usinas.map((usina) => {
                                        const status = usinaStatus(usina.statusMonitoramento);
                                        return (
                                            <UsinaCard key={usina.id} type="button" $tom={usina.ativa ? TONS[status.tone] : 'var(--c-border)'} onClick={() => irPara(`/usinas/${usina.id}`)}>
                                                <div className="topo">
                                                    <span className="codigo">{usina.code}</span>
                                                    {usina.ativa ? <Badge $tone={status.tone}>{status.label}</Badge> : <Badge>Inativa</Badge>}
                                                </div>
                                                <div className="local">{[usina.cidade && `${usina.cidade}${usina.uf ? `/${usina.uf}` : ''}`, usina.local].filter(Boolean)[0]}</div>
                                                <div className="medidas">
                                                    <span><Muted>Potência</Muted><strong>{usina.installedPower} kWp</strong></span>
                                                    <span><Muted>Gerou hoje</Muted><strong>{usina.eToday != null ? `${Number(usina.eToday).toFixed(1)} kWh` : '—'}</strong></span>
                                                    <span><Muted>Agora</Muted><strong>{usina.potenciaW != null ? `${Number(usina.potenciaW).toFixed(0)} W` : '—'}</strong></span>
                                                    <span><Muted>Inversor</Muted><strong>{inversorLabel(usina.inversor)}</strong></span>
                                                </div>
                                                <div className="rodape">
                                                    {usina.ultimaLeituraEm ? `Última leitura ${tempoDesde(usina.ultimaLeituraEm)}` : 'Ainda sem leitura'}
                                                    {usina.statusMonitoramento && !status.ok && status.hint ? ` · ${status.hint}` : ''}
                                                </div>
                                            </UsinaCard>
                                        );
                                    })}
                                </UsinaGrid>
                            )
                        )}

                        {aba === 'contratos' && (
                            data.contratos.length === 0 ? (
                                <p><Muted>Nenhum contrato para este cliente.</Muted></p>
                            ) : (
                                <Lista>
                                    {data.contratos.map((contrato) => {
                                        const { parcelas } = contrato;
                                        const percentual = parcelas.total > 0 ? Math.round((parcelas.pagos / parcelas.total) * 100) : 0;
                                        return (
                                            <Linha key={contrato.id} type="button" $tom={TONS[statusContratoTone[contrato.status]] ?? 'var(--c-muted)'} onClick={() => irPara(`/contratos/${contrato.id}`)} style={{ gridTemplateColumns: '1fr auto' }}>
                                                <span>
                                                    <div className="titulo">{tipoContratoLabel(contrato.tipo)} · {formatDate(contrato.dataContrato)}</div>
                                                    <Row $gap={6} style={{ margin: '4px 0 6px' }}>
                                                        <Badge $tone={statusContratoTone[contrato.status]}>{statusContratoLabel(contrato.status)}</Badge>
                                                        <Muted style={{ fontSize: '0.82rem' }}>
                                                            {contrato.quantParcelas === 1 ? 'À vista' : `${contrato.quantParcelas}x de ${brl(contrato.priceParcela)}`}
                                                        </Muted>
                                                        {parcelas.vencidos > 0 && <Badge $tone="danger">{parcelas.vencidos} vencida(s)</Badge>}
                                                    </Row>
                                                    {parcelas.total > 0 ? (
                                                        <>
                                                            <Progresso><span style={{ width: `${percentual}%` }} /></Progresso>
                                                            <Muted style={{ fontSize: '0.78rem' }}>{parcelas.pagos} de {parcelas.total} parcelas recebidas</Muted>
                                                        </>
                                                    ) : (
                                                        <Muted style={{ fontSize: '0.8rem' }}>Parcelas ainda não geradas no financeiro.</Muted>
                                                    )}
                                                </span>
                                                <span className="valor">{brl(contrato.priceTotal)}</span>
                                            </Linha>
                                        );
                                    })}
                                </Lista>
                            )
                        )}
                    </>
                )}
            </Dialog>

            {detalheId && <LancamentoDialog id={detalheId} onClose={() => setDetalheId(null)} />}
            <BaixaDialog open={Boolean(baixando)} lancamento={baixando} onClose={() => setBaixando(null)} />
            <LancamentoFormDialog
                open={novo}
                tipo="RECEBER"
                preset={cliente ? { cliente: { id: cliente.id, nome: cliente.nome } } : undefined}
                onClose={() => setNovo(false)}
            />
        </>
    );
}
