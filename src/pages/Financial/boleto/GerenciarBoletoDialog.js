import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBan, FaCheckCircle, FaCopy, FaExclamationTriangle, FaHistory, FaSyncAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { financeiroApi } from '../../../api/resources';
import { Badge, Button, ConfirmDialog, Dialog, ErrorBlock, FilterInput, Grid, KeyValue, LoadingBlock, Muted, Row, SectionTitle, tokens } from '../../../ui';
import { dataBr, dataHoraBr, hojeIso } from '../../../utils/datas';
import { brl } from '../format';

const { colors } = tokens;

const TOM_SITUACAO = {
    EM_CARTEIRA: 'info',
    VENCIDO: 'danger',
    LIQUIDADO: 'success',
    BAIXADO: 'neutral',
    BAIXA_PENDENTE: 'warning',
    PROTESTO: 'warning',
    NEGATIVACAO: 'warning',
    REJEITADO: 'danger',
    DESCONHECIDA: 'neutral',
};

const Caixa = styled.div`
    padding: 14px;
    margin-bottom: 12px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surfaceAlt};

    h4 {
        margin: 0 0 4px;
        font-size: 0.95rem;
    }

    p {
        margin: 0 0 10px;
        font-size: 0.85rem;
        color: ${colors.muted};
    }
`;

const Linha = styled.div`
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;

    > .campo {
        flex: 1 1 180px;
        max-width: 240px;
    }
`;

const Codigo = styled.code`
    display: block;
    padding: 8px 10px;
    border-radius: 8px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    font-size: 0.82rem;
    word-break: break-all;
`;

const Historico = styled.ol`
    list-style: none;
    margin: 0;
    padding: 0;

    li {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid ${colors.border};
        font-size: 0.88rem;
    }

    li:last-child {
        border-bottom: 0;
    }

    time {
        flex: none;
        width: 118px;
        color: ${colors.muted};
        font-size: 0.8rem;
    }
`;

const ROTULO_TIPO = { EMITIDO: 'Emissão', COMANDO: 'Instrução', CONSULTA: 'Consulta', LIQUIDACAO: 'Liquidação', ESTORNO: 'Estorno', ERRO: 'Recusado', BAIXA_MANUAL: 'Baixa' };
const TOM_TIPO = { EMITIDO: 'info', COMANDO: 'neutral', CONSULTA: 'neutral', LIQUIDACAO: 'success', ESTORNO: 'warning', ERRO: 'danger', BAIXA_MANUAL: 'success' };

function copiar(texto, mensagem) {
    navigator.clipboard?.writeText(texto).then(() => toast.success(mensagem));
}

/** Situação do boleto no banco, instruções (vencimento, abatimento, baixa, protesto…) e histórico. */
export default function GerenciarBoletoDialog({ lancamento, onClose }) {
    const queryClient = useQueryClient();
    const [vencimento, setVencimento] = useState('');
    const [abatimento, setAbatimento] = useState('');
    const [juros, setJuros] = useState('');
    const [desconto, setDesconto] = useState({ valorDesconto1: '', valorDesconto2: '', valorDesconto3: '' });
    const [confirmacao, setConfirmacao] = useState(null);
    const [avancado, setAvancado] = useState(false);

    const detalhe = useQuery({ queryKey: ['financeiro', 'boleto', lancamento.id], queryFn: () => financeiroApi.boleto(lancamento.id) });

    const atualizarTudo = () => queryClient.invalidateQueries({ queryKey: ['financeiro'] });

    const consultar = useMutation({
        mutationFn: () => financeiroApi.atualizarBoleto(lancamento.id),
        onSuccess: async (resultado) => {
            await atualizarTudo();
            toast.success(resultado.baixouAgora ? 'Boleto liquidado: a baixa foi registrada.' : `Situação no banco: ${resultado.rotulo}.`);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const instruir = useMutation({
        mutationFn: (payload) => financeiroApi.comandoBoleto(lancamento.id, payload),
        onSuccess: async (resultado) => {
            await atualizarTudo();
            setConfirmacao(null);
            toast.success(`${resultado.rotulo}: instrução enviada ao banco. A confirmação pode levar alguns minutos.`);
        },
        onError: (erro) => {
            setConfirmacao(null);
            toast.error(errorMessage(erro));
        },
    });

    const dados = detalhe.data;
    const situacao = dados?.situacao;
    const aberto = ['ABERTO', 'PARCIAL'].includes(lancamento.status);
    const aceitaComando = Boolean(dados?.emitido) && aberto && !situacao?.encerrado;

    const perguntar = (titulo, mensagem, payload, danger = false) => setConfirmacao({ titulo, mensagem, payload, danger });

    return (
        <>
            <Dialog
                open
                width={760}
                title="Boleto"
                subtitle={`${lancamento.descricao} · ${brl(lancamento.valor)}`}
                onClose={onClose}
                footer={<Button variant="secondary" onClick={onClose}>Fechar</Button>}
            >
                {detalhe.isLoading && <LoadingBlock />}
                {detalhe.error && <ErrorBlock message={errorMessage(detalhe.error)} onRetry={detalhe.refetch} />}

                {dados && (
                    <>
                        <Row $justify="space-between" style={{ marginBottom: 14 }}>
                            <Row>
                                {situacao ? (
                                    <Badge $tone={TOM_SITUACAO[situacao.codigo] ?? 'neutral'}>{situacao.rotulo}</Badge>
                                ) : (
                                    <Badge $tone="neutral">Sem consulta ao banco</Badge>
                                )}
                                {situacao?.consultadoEm && <Muted>consultado em {dataHoraBr(situacao.consultadoEm)}</Muted>}
                            </Row>
                            <Button size="sm" variant="secondary" icon={<FaSyncAlt />} loading={consultar.isPending} onClick={() => consultar.mutate()}>
                                Atualizar no banco
                            </Button>
                        </Row>

                        <Grid $cols={2}>
                            <KeyValue label="Nosso número">{dados.nossoNumero}</KeyValue>
                            <KeyValue label="Seu número">{dados.seuNumero}</KeyValue>
                            <KeyValue label="Vencimento">{dataBr(String(lancamento.dataVencimento).slice(0, 10))}</KeyValue>
                            <KeyValue label="Emitido em">{dados.emitidoEm ? dataHoraBr(dados.emitidoEm) : ''}</KeyValue>
                        </Grid>

                        {dados.linhaDigitavel && (
                            <div style={{ marginTop: 12 }}>
                                <Muted>Linha digitável</Muted>
                                <Row style={{ marginTop: 4 }}>
                                    <Codigo style={{ flex: 1 }}>{dados.linhaDigitavel}</Codigo>
                                    <Button size="sm" variant="ghost" icon={<FaCopy />} onClick={() => copiar(dados.linhaDigitavel, 'Linha digitável copiada.')}>Copiar</Button>
                                </Row>
                            </div>
                        )}
                        {dados.pixCopiaECola && (
                            <div style={{ marginTop: 12 }}>
                                <Muted>Pix copia e cola</Muted>
                                <Row style={{ marginTop: 4 }}>
                                    <Codigo style={{ flex: 1 }}>{dados.pixCopiaECola}</Codigo>
                                    <Button size="sm" variant="ghost" icon={<FaCopy />} onClick={() => copiar(dados.pixCopiaECola, 'Pix copia e cola copiado.')}>Copiar</Button>
                                </Row>
                            </div>
                        )}

                        {situacao?.liquidado && (
                            <p style={{ marginTop: 14 }}><Badge $tone="success"><FaCheckCircle /> Pago</Badge> <Muted>O banco informa que este boleto foi liquidado.</Muted></p>
                        )}
                        {situacao?.encerrado && !situacao.liquidado && (
                            <p style={{ marginTop: 14 }}>
                                <Badge $tone="warning"><FaExclamationTriangle /> Encerrado</Badge>{' '}
                                <Muted>
                                    Este boleto não pode mais ser pago.
                                    {dados.podeEmitirOutro ? ' Feche esta janela e emita um novo boleto, se ainda houver cobrança.' : ''}
                                </Muted>
                            </p>
                        )}

                        {aceitaComando && (
                            <div style={{ marginTop: 18 }}>
                                <SectionTitle icon={FaBan} tom="orange">Instruções ao banco</SectionTitle>

                                <Caixa>
                                    <h4>Alterar vencimento</h4>
                                    <p>O novo vencimento vale para o boleto e para o lançamento.</p>
                                    <Linha>
                                        <div className="campo">
                                            <FilterInput label="Nova data" type="date" min={hojeIso()} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!vencimento || vencimento < hojeIso()}
                                            onClick={() => perguntar('Alterar vencimento', `Mudar o vencimento do boleto para ${dataBr(vencimento)}?`, { comando: 'ALTERAR_VENCIMENTO', dataVencimento: vencimento })}
                                        >
                                            Alterar vencimento
                                        </Button>
                                    </Linha>
                                </Caixa>

                                <Caixa>
                                    <h4>Abatimento</h4>
                                    <p>Reduz o valor a pagar em um valor fixo (R$).</p>
                                    <Linha>
                                        <div className="campo">
                                            <FilterInput label="Valor do abatimento (R$)" type="number" min="0" step="0.01" value={abatimento} onChange={(e) => setAbatimento(e.target.value)} />
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!(Number(abatimento) > 0)}
                                            onClick={() => perguntar('Conceder abatimento', `Conceder abatimento de ${brl(Number(abatimento))} neste boleto?`, { comando: 'CONCEDER_ABATIMENTO', valorAbatimento: Number(abatimento) })}
                                        >
                                            Conceder
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => perguntar('Cancelar abatimento', 'Cancelar o abatimento já concedido?', { comando: 'CANCELAR_ABATIMENTO' })}>
                                            Cancelar abatimento
                                        </Button>
                                    </Linha>
                                </Caixa>

                                <Caixa>
                                    <h4>Cancelar o boleto no banco</h4>
                                    <p>Pede a baixa do título: ele deixa de poder ser pago. Use quando o cliente pagou por outro meio ou a cobrança mudou.</p>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => perguntar('Pedir baixa do boleto', 'Pedir a baixa deste boleto ao Sicredi? Depois disso o cliente não conseguirá mais pagá-lo.', { comando: 'BAIXA' }, true)}
                                    >
                                        Pedir baixa
                                    </Button>
                                </Caixa>

                                <Button size="sm" variant="ghost" onClick={() => setAvancado((v) => !v)}>
                                    {avancado ? 'Ocultar' : 'Mostrar'} instruções avançadas (juros, desconto, protesto, negativação)
                                </Button>

                                {avancado && (
                                    <div style={{ marginTop: 12 }}>
                                        <Caixa>
                                            <h4>Juros</h4>
                                            <p>Valor ou percentual conforme o tipo de juros definido na emissão.</p>
                                            <Linha>
                                                <div className="campo">
                                                    <FilterInput label="Novo valor/percentual" type="number" min="0" step="0.01" value={juros} onChange={(e) => setJuros(e.target.value)} />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={!(Number(juros) > 0)}
                                                    onClick={() => perguntar('Alterar juros', `Alterar os juros do boleto para ${juros}?`, { comando: 'ALTERAR_JUROS', valorOuPercentual: Number(juros) })}
                                                >
                                                    Alterar juros
                                                </Button>
                                            </Linha>
                                        </Caixa>

                                        <Caixa>
                                            <h4>Descontos</h4>
                                            <p>Até três valores de desconto. Zero remove o desconto.</p>
                                            <Linha>
                                                {['valorDesconto1', 'valorDesconto2', 'valorDesconto3'].map((campo, indice) => (
                                                    <div className="campo" key={campo}>
                                                        <FilterInput
                                                            label={`Desconto ${indice + 1}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={desconto[campo]}
                                                            onChange={(e) => setDesconto((atual) => ({ ...atual, [campo]: e.target.value }))}
                                                        />
                                                    </div>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    disabled={Object.values(desconto).every((v) => v === '')}
                                                    onClick={() => perguntar('Alterar descontos', 'Enviar os novos valores de desconto ao banco?', {
                                                        comando: 'ALTERAR_DESCONTO',
                                                        valorDesconto1: Number(desconto.valorDesconto1) || 0,
                                                        valorDesconto2: Number(desconto.valorDesconto2) || 0,
                                                        valorDesconto3: Number(desconto.valorDesconto3) || 0,
                                                    })}
                                                >
                                                    Alterar descontos
                                                </Button>
                                            </Linha>
                                        </Caixa>

                                        <Caixa>
                                            <h4>Protesto e negativação</h4>
                                            <p>Instruções com efeito em cartório ou nos órgãos de proteção ao crédito. Só funcionam em títulos vencidos e com o serviço contratado.</p>
                                            <Row>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Pedir protesto', 'Enviar o título a protesto em cartório?', { comando: 'PROTESTAR' }, true)}>Pedir protesto</Button>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Sustar protesto', 'Sustar o protesto e manter o título em carteira?', { comando: 'SUSTAR_PROTESTO_MANTER' })}>Sustar e manter</Button>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Sustar protesto e baixar', 'Sustar o protesto e baixar o título?', { comando: 'SUSTAR_PROTESTO_BAIXAR' }, true)}>Sustar e baixar</Button>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Cancelar protesto automático', 'Cancelar o protesto automático configurado neste boleto?', { comando: 'CANCELAR_PROTESTO_AUTOMATICO' })}>Cancelar automático</Button>
                                            </Row>
                                            <Row style={{ marginTop: 8 }}>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Negativar', 'Incluir o pagador em cadastro de inadimplentes (negativação)?', { comando: 'NEGATIVAR' }, true)}>Negativar</Button>
                                                <Button size="sm" variant="secondary" onClick={() => perguntar('Excluir negativação e baixar', 'Excluir a negativação e baixar o título?', { comando: 'SUSTAR_NEGATIVACAO_BAIXAR' }, true)}>Excluir negativação e baixar</Button>
                                            </Row>
                                        </Caixa>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: 18 }}>
                            <SectionTitle icon={FaHistory} tom="gray">Histórico</SectionTitle>
                            {dados.historico.length === 0 ? (
                                <Muted>Nenhum registro ainda.</Muted>
                            ) : (
                                <Historico>
                                    {dados.historico.map((item) => (
                                        <li key={item.id}>
                                            <time>{dataHoraBr(item.createdAt)}</time>
                                            <span><Badge $tone={TOM_TIPO[item.tipo] ?? 'neutral'}>{ROTULO_TIPO[item.tipo] ?? item.tipo}</Badge> {item.descricao}</span>
                                        </li>
                                    ))}
                                </Historico>
                            )}
                        </div>
                    </>
                )}
            </Dialog>

            <ConfirmDialog
                open={Boolean(confirmacao)}
                title={confirmacao?.titulo ?? ''}
                message={confirmacao?.mensagem ?? ''}
                confirmLabel="Enviar ao banco"
                danger={Boolean(confirmacao?.danger)}
                loading={instruir.isPending}
                onConfirm={() => instruir.mutate(confirmacao.payload)}
                onClose={() => setConfirmacao(null)}
            />
        </>
    );
}
