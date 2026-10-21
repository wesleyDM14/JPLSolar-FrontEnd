import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client';
import { financeiroApi, openFileInTab } from '../../api/resources';
import { Button, Dialog, ErrorBlock, FilterInput, FilterSelect, LoadingBlock, Muted, tokens } from '../../ui';
import { hojeIso, somarDias } from '../../utils/datas';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatCurrency, formatDate } from '../../utils/masks';
import { formaOptions } from '../Financial/format';

const { colors } = tokens;

const MANUAL = 'MANUAL';

const MODOS = [
    { value: 'GERAR', label: 'Gerar boleto de quitação (valor calculado)' },
    { value: 'REGISTRAR', label: 'Registrar quitação ou amortização que já foi paga' },
];

const Quadro = ({ children }) => (
    <div style={{ padding: 12, borderRadius: 10, background: colors.background, lineHeight: 1.7, fontVariantNumeric: 'tabular-nums' }}>{children}</div>
);

/** Campo numérico pequeno, alinhado à direita, dentro do quadro do cálculo. */
const Editavel = ({ rotulo, valor, calculado, sinal = '', onChange }) => (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{rotulo}{valor !== calculado && <span style={{ color: colors.muted }}> (calculado: {formatCurrency(calculado)})</span>}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {sinal}
            <input
                type="number"
                step="0.01"
                min="0"
                value={Number.isFinite(valor) ? valor : ''}
                onChange={(evento) => onChange(evento.target.value)}
                style={{ width: 120, textAlign: 'right', padding: '4px 8px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, font: 'inherit' }}
            />
        </span>
    </label>
);

const Linha = ({ rotulo, valor, destaque, cor }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: destaque ? 700 : 400, color: cor }}>
        <span>{rotulo}</span>
        <span>{valor}</span>
    </div>
);

/**
 * Quitação do contrato.
 *  - Gerar boleto: o valor é calculado na data em que o cliente vai pagar (parcelas a vencer com desconto, vencidas com
 *    multa e mora). Quando o boleto for pago, as parcelas em aberto são canceladas e o contrato fica Quitado.
 *  - Registrar: para quitação já paga (boleto pago sem vínculo ou outro recebimento).
 */
export default function QuitarContratoDialog({ contrato, onClose }) {
    const queryClient = useQueryClient();
    const documento = String(contrato.cliente?.documento ?? '').replace(/\D/g, '');

    const [modo, setModo] = useState('GERAR');
    const [vencimento, setVencimento] = useState(somarDias(hojeIso(), 3));
    const [taxa, setTaxa] = useState('2');
    const [encargos, setEncargos] = useState(true);
    const [tipoRegistro, setTipoRegistro] = useState('QUITACAO');
    const [valorFinal, setValorFinal] = useState('');
    // Ajustes manuais dos componentes do cálculo (vazio = usa o calculado).
    const [ajuste, setAjuste] = useState({ multa: '', mora: '', desconto: '' });
    const [gerado, setGerado] = useState(null);

    const [escolha, setEscolha] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(hojeIso());
    const [forma, setForma] = useState('PIX');

    const taxaDebounced = useDebouncedValue(taxa);
    const taxaNumero = Math.max(0, Number(String(taxaDebounced).replace(',', '.')) || 0);

    const atualizar = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contratos'] }),
        queryClient.invalidateQueries({ queryKey: ['contrato', contrato.id] }),
        queryClient.invalidateQueries({ queryKey: ['financeiro'] }),
    ]);

    const parcelas = useQuery({
        queryKey: ['financeiro', 'contrato', 'parcelas', contrato.id],
        queryFn: () => financeiroApi.contratoParcelas(contrato.id),
    });

    const calculo = useQuery({
        queryKey: ['financeiro', 'contrato', 'quitacao', contrato.id, vencimento, taxaNumero, encargos],
        queryFn: () => financeiroApi.calculoQuitacao(contrato.id, { data: vencimento, taxa: taxaNumero, encargos }),
        enabled: modo === 'GERAR' && Boolean(vencimento),
        placeholderData: (anterior) => anterior,
    });

    const boletos = useQuery({
        queryKey: ['financeiro', 'boletos-banco', 'quitacao', documento],
        queryFn: () => financeiroApi.boletosBanco({ grupo: 'pagos', vinculo: 'nao', search: documento, pageSize: 50, sort: 'dataLiquidacao:desc' }),
        enabled: modo === 'REGISTRAR' && documento.length >= 11,
    });

    const gerar = useMutation({
        mutationFn: (payload) => financeiroApi.gerarBoletoQuitacao(contrato.id, payload),
        onSuccess: async (resposta) => {
            await atualizar();
            setGerado(resposta);
            toast.success('Boleto de quitação gerado.');
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const registrar = useMutation({
        mutationFn: (payload) => financeiroApi.quitarContrato(contrato.id, payload),
        onSuccess: async (resposta) => {
            await atualizar();
            toast.success(resposta.resumo);
            if (resposta.boletosParaBaixar > 0) toast(`${resposta.boletosParaBaixar} boleto(s) das parcelas canceladas ainda estão ativos no banco. A baixa é feita automaticamente.`, { duration: 9000 });
            onClose();
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const lista = parcelas.data?.parcelas ?? [];
    const abertas = lista.filter((p) => p.status === 'ABERTO');
    const parciais = lista.filter((p) => p.status === 'PARCIAL');
    const totalAberto = abertas.reduce((soma, p) => soma + p.restante, 0);
    const c = calculo.data;
    const calculado = c?.total ?? 0;

    // Um novo cálculo (data, taxa ou encargos) descarta os ajustes feitos à mão.
    useEffect(() => {
        setAjuste({ multa: '', mora: '', desconto: '' });
        setValorFinal('');
    }, [c?.dataPagamento, c?.taxaMensal, c?.total]);

    const numeroOu = (texto, padrao) => (texto === '' ? padrao : Math.max(0, Number(String(texto).replace(',', '.')) || 0));
    const multa = numeroOu(ajuste.multa, c?.vencidas.multa ?? 0);
    const mora = numeroOu(ajuste.mora, c?.vencidas.mora ?? 0);
    const desconto = numeroOu(ajuste.desconto, c?.vincendas.desconto ?? 0);
    const totalAjustado = c ? Math.max(0, Math.round((c.vencidas.valor + multa + mora + c.vincendas.valorFace - desconto) * 100) / 100) : 0;
    const valorEditado = valorFinal !== '' ? Number(String(valorFinal).replace(',', '.')) || 0 : null;
    const valorDoBoleto = valorEditado ?? totalAjustado;

    const disponiveis = boletos.data?.data ?? [];
    const boleto = disponiveis.find((b) => b.nossoNumero === escolha);
    const manual = escolha === MANUAL;
    const valorRecebido = boleto ? boleto.valor : Number(String(valor).replace(',', '.')) || 0;
    const prontoRegistrar = (tipoRegistro === 'AMORTIZACAO' || parciais.length === 0) && (boleto || (manual && valorRecebido > 0 && data));

    const opcoes = [
        ...disponiveis.map((b) => ({ value: b.nossoNumero, label: `${b.nossoNumeroFormatado} · ${formatCurrency(b.valor)} · pago em ${formatDate(b.dataLiquidacao)}` })),
        { value: MANUAL, label: 'Outro recebimento (informar valor e data)' },
    ];

    const emitidoComSucesso = Boolean(gerado);

    return (
        <Dialog
            open
            title="Quitar contrato"
            subtitle={contrato.cliente?.nome}
            width={560}
            onClose={gerar.isPending || registrar.isPending ? undefined : onClose}
            footer={
                emitidoComSucesso ? (
                    <Button onClick={onClose}>Fechar</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={onClose} disabled={gerar.isPending || registrar.isPending}>Voltar</Button>
                        {modo === 'GERAR' ? (
                            <Button
                                loading={gerar.isPending}
                                disabled={!c || c.parcelas === 0 || valorDoBoleto <= 0 || parciais.length > 0}
                                onClick={() => gerar.mutate({ vencimento, taxa: taxaNumero, encargos, valor: Math.abs(valorDoBoleto - calculado) > 0.005 ? valorDoBoleto : undefined })}
                            >
                                Gerar boleto de quitação
                            </Button>
                        ) : (
                            <Button
                                loading={registrar.isPending}
                                disabled={!prontoRegistrar}
                                onClick={() => registrar.mutate(boleto ? { tipo: tipoRegistro, nossoNumero: boleto.nossoNumero } : { tipo: tipoRegistro, valor: valorRecebido, dataPagamento: data, forma })}
                            >
                                {tipoRegistro === 'AMORTIZACAO' ? 'Registrar amortização' : 'Registrar quitação'}
                            </Button>
                        )}
                    </>
                )
            }
        >
            {parcelas.isLoading ? (
                <LoadingBlock />
            ) : parcelas.error ? (
                <ErrorBlock message={errorMessage(parcelas.error)} onRetry={parcelas.refetch} />
            ) : emitidoComSucesso ? (
                <div style={{ display: 'grid', gap: 12 }}>
                    <Quadro>
                        <Linha rotulo="Boleto de quitação" valor={gerado.boleto?.nossoNumero} />
                        <Linha rotulo="Valor" valor={formatCurrency(gerado.valor)} destaque />
                        <Linha rotulo="Vencimento" valor={formatDate(vencimento)} />
                    </Quadro>
                    <Button variant="secondary" onClick={() => openFileInTab(() => financeiroApi.boletoPdf(gerado.lancamentoId), 'boleto-quitacao.pdf', 'Abrindo boleto…').catch((erro) => toast.error(errorMessage(erro)))}>
                        Abrir PDF do boleto
                    </Button>
                    <Muted>
                        O contrato continua ativo até o pagamento. Quando o banco avisar que o boleto foi pago, as {abertas.length} parcelas em aberto são canceladas,
                        os boletos delas recebem baixa no banco e o contrato fica Quitado. O valor vale para o vencimento acima.
                    </Muted>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    <FilterSelect label="O que fazer" placeholder={null} options={MODOS} value={modo} onChange={(evento) => setModo(evento.target.value)} />

                    {parciais.length > 0 && (
                        <div style={{ padding: 12, borderRadius: 10, background: colors.dangerBg, color: colors.danger }}>
                            {parciais.length} parcela(s) com pagamento parcial. Conclua ou estorne esses pagamentos antes de quitar.
                        </div>
                    )}

                    {modo === 'GERAR' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                <FilterInput label="Vencimento do boleto" type="date" min={hojeIso()} value={vencimento} onChange={(evento) => { setVencimento(evento.target.value); setValorFinal(''); }} />
                                <FilterInput label="Desconto das parcelas a vencer (% ao mês)" type="number" step="0.01" min="0" value={taxa} onChange={(evento) => { setTaxa(evento.target.value); setValorFinal(''); }} />
                            </div>
                            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={encargos} onChange={(evento) => { setEncargos(evento.target.checked); setValorFinal(''); }} />
                                Cobrar multa (2%) e mora (0,33% ao dia) das parcelas vencidas
                            </label>

                            {calculo.error ? (
                                <ErrorBlock message={errorMessage(calculo.error)} onRetry={calculo.refetch} />
                            ) : !c ? (
                                <LoadingBlock />
                            ) : c.parcelas === 0 ? (
                                <Muted>Este contrato não tem parcelas em aberto para quitar.</Muted>
                            ) : (
                                <>
                                    <Quadro>
                                        {c.vencidas.quantidade > 0 && <Linha rotulo={`${c.vencidas.quantidade} parcela(s) vencida(s)`} valor={formatCurrency(c.vencidas.valor)} />}
                                        {c.vencidas.quantidade > 0 && (
                                            <>
                                                <Editavel rotulo="Multa" sinal="+" valor={multa} calculado={c.vencidas.multa} onChange={(texto) => setAjuste((a) => ({ ...a, multa: texto }))} />
                                                <Editavel rotulo="Mora" sinal="+" valor={mora} calculado={c.vencidas.mora} onChange={(texto) => setAjuste((a) => ({ ...a, mora: texto }))} />
                                            </>
                                        )}
                                        <Linha rotulo={`${c.vincendas.quantidade} parcela(s) a vencer (valor cheio)`} valor={formatCurrency(c.vincendas.valorFace)} />
                                        <Editavel rotulo="Desconto" sinal="−" valor={desconto} calculado={c.vincendas.desconto} onChange={(texto) => setAjuste((a) => ({ ...a, desconto: texto }))} />
                                        <hr style={{ border: 0, borderTop: `1px solid ${colors.border}`, margin: '6px 0' }} />
                                        <Linha rotulo="Valor da quitação nesta data" valor={formatCurrency(totalAjustado)} destaque />
                                        <Muted>Sem desconto seriam {formatCurrency(c.semDesconto)}. O valor muda conforme a data do pagamento.</Muted>
                                    </Quadro>
                                    <FilterInput
                                        label="Valor a cobrar no boleto (R$) — altere só se combinou outro valor"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={String(totalAjustado)}
                                        value={valorFinal}
                                        onChange={(evento) => setValorFinal(evento.target.value)}
                                    />
                                    {Math.abs(valorDoBoleto - calculado) > 0.005 && <Muted>Valor ajustado: {formatCurrency(valorDoBoleto)} (calculado: {formatCurrency(calculado)}).</Muted>}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <FilterSelect
                                label="O que foi esse pagamento"
                                placeholder={null}
                                value={tipoRegistro}
                                onChange={(evento) => setTipoRegistro(evento.target.value)}
                                options={[
                                    { value: 'QUITACAO', label: 'Quitação (encerra o contrato)' },
                                    { value: 'AMORTIZACAO', label: 'Amortização (abate a dívida e o contrato continua)' },
                                ]}
                            />
                            <p style={{ margin: 0, lineHeight: 1.55 }}>
                                {lista.filter((p) => p.status === 'PAGO').length} parcela(s) paga(s) e {abertas.length} em aberto ({formatCurrency(totalAberto)}).
                                {tipoRegistro === 'QUITACAO'
                                    ? ` As ${abertas.length} em aberto serão canceladas e o contrato fica como Quitado.`
                                    : ' O recebimento fica registrado no contrato; as parcelas em aberto continuam como estão.'}
                            </p>
                            <FilterSelect
                                label="Pagamento da quitação"
                                placeholder="Escolha o boleto pago ou outro recebimento"
                                value={escolha}
                                onChange={(evento) => setEscolha(evento.target.value)}
                                options={opcoes}
                            />
                            {boletos.isLoading && <Muted>Buscando boletos pagos deste cliente…</Muted>}
                            {!boletos.isLoading && disponiveis.length === 0 && <Muted>Nenhum boleto pago sem vínculo foi encontrado para este cliente. Use “Outro recebimento”.</Muted>}

                            {manual && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                    <FilterInput label="Valor recebido (R$)" type="number" step="0.01" min="0" value={valor} onChange={(evento) => setValor(evento.target.value)} />
                                    <FilterInput label="Data do recebimento" type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
                                    <FilterSelect label="Forma" placeholder={null} options={formaOptions} value={forma} onChange={(evento) => setForma(evento.target.value)} />
                                </div>
                            )}

                            {tipoRegistro === 'QUITACAO' && valorRecebido > 0 && abertas.length > 0 && (
                                <Quadro>
                                    <Linha rotulo="Recebido na quitação" valor={formatCurrency(valorRecebido)} />
                                    <Linha rotulo="Parcelas canceladas" valor={formatCurrency(totalAberto)} />
                                    <Linha rotulo={totalAberto >= valorRecebido ? 'Desconto da quitação' : 'Recebido a mais'} valor={formatCurrency(Math.abs(totalAberto - valorRecebido))} />
                                </Quadro>
                            )}
                        </>
                    )}
                </div>
            )}
        </Dialog>
    );
}
