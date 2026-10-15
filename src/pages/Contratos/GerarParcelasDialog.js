import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { Badge, Button, Dialog, Muted } from '../../ui';
import { hojeIso } from '../../utils/datas';
import { formatCurrency, formatDate } from '../../utils/masks';
import { OPCOES_PADRAO, OpcoesBoletoCampos, opcoesParaApi, opcoesSchema } from '../Financial/boleto/OpcoesBoleto';
import ResultadoEmissao from '../Financial/boleto/ResultadoEmissao';

/**
 * Cria as parcelas a receber do contrato no financeiro. Opcionalmente já emite o boleto de cada uma no Sicredi.
 * Com `refazer`, substitui as parcelas em aberto (o servidor recusa se houver baixa ou boleto vivo).
 */
export default function GerarParcelasDialog({ contrato, refazer = false, motivo, onClose, onConflito }) {
    const queryClient = useQueryClient();
    const primeiroVencimento = String(contrato.dataPrimeiraParcela).slice(0, 10);
    const vencimentoPassado = primeiroVencimento < hojeIso();

    const [progresso, setProgresso] = useState(null); // { feitos, total }
    const [resultado, setResultado] = useState(null);

    const gerar = useMutation({
        mutationFn: (payload) => financeiroApi.gerarParcelas(contrato.id, payload),
    });

    // Emite os boletos em pedaços pequenos: contratos longos (48 parcelas) passam de um minuto numa chamada só.
    const emitirEmPedacos = async (ids, opcoes) => {
        const total = ids.length;
        const resultado = { emitidos: 0, falhas: [] };
        setProgresso({ feitos: 0, total });

        for (let inicio = 0; inicio < total; inicio += 8) {
            const parte = await financeiroApi.boletosEmLote({ ids: ids.slice(inicio, inicio + 8), opcoes });
            resultado.emitidos += parte.emitidos;
            resultado.falhas.push(...parte.falhas);
            setProgresso({ feitos: Math.min(inicio + 8, total), total });
            // Banco recusando credenciais ou limitando: não adianta continuar.
            if (parte.emitidos === 0 && parte.falhas.length > 0 && parte.falhas.every((f) => /credenciais|limitou|não respondeu|falar com o Sicredi/i.test(f.motivo))) break;
        }

        return resultado;
    };

    if (resultado) {
        return <ResultadoEmissao titulo="Parcelas e boletos gerados" {...resultado} onClose={onClose} />;
    }

    return (
        <Formik
            initialValues={{ emitirBoletos: false, ...OPCOES_PADRAO }}
            validationSchema={opcoesSchema}
            onSubmit={async (valores) => {
                try {
                    const resultado = await gerar.mutateAsync({ refazer });
                    toast.success(`${resultado.geradas} parcela(s) criadas em Financeiro > A receber.`);

                    if (valores.emitirBoletos) {
                        const boletos = await emitirEmPedacos(resultado.ids, opcoesParaApi(valores));
                        toast.success(`${boletos.emitidos} boleto(s) emitido(s) no Sicredi.`);
                        if (boletos.falhas.length > 0) {
                            toast.error(`${boletos.falhas.length} boleto(s) não emitido(s): ${boletos.falhas[0].motivo}`, { duration: 9000 });
                        }

                        await queryClient.invalidateQueries({ queryKey: ['financeiro'] });

                        // Resultado com a opção de imprimir os boletos recém-emitidos.
                        const comFalha = new Set(boletos.falhas.map((f) => f.lancamentoId));
                        setResultado({ emitidos: boletos.emitidos, falhas: boletos.falhas, ids: resultado.ids.filter((id) => !comFalha.has(id)) });
                        return;
                    }

                    await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
                    onClose();
                } catch (erro) {
                    // Já existem parcelas: o chamador oferece "refazer".
                    if (erro?.response?.status === 409 && !refazer && onConflito) {
                        onConflito(errorMessage(erro));
                        return;
                    }
                    toast.error(errorMessage(erro));
                }
            }}
        >
            {({ isSubmitting, values }) => (
                <Dialog
                    open
                    width={640}
                    title={refazer ? 'Refazer parcelas' : 'Gerar parcelas a receber'}
                    subtitle={`${contrato.quantParcelas} parcela(s) de ${formatCurrency(contrato.quantParcelas === 1 ? contrato.priceTotal : contrato.priceParcela)}, a partir de ${formatDate(contrato.dataPrimeiraParcela)}`}
                    onClose={onClose}
                    footer={
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" form="gerar-parcelas" loading={isSubmitting}>
                                {progresso
                                    ? `Emitindo boletos ${progresso.feitos}/${progresso.total}…`
                                    : values.emitirBoletos ? 'Gerar parcelas e boletos' : refazer ? 'Refazer parcelas' : 'Gerar parcelas'}
                            </Button>
                        </>
                    }
                >
                    {refazer && (
                        <p style={{ marginBottom: 12 }}>
                            <Muted>{motivo ?? 'Este contrato já tem parcelas.'} Deseja substituir as parcelas em aberto por novas, com os valores e vencimentos atuais do contrato?</Muted>
                        </p>
                    )}

                    <Form noValidate id="gerar-parcelas">
                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                            <Field type="checkbox" name="emitirBoletos" style={{ marginTop: 4 }} />
                            <span>
                                <strong>Emitir os boletos no Sicredi agora</strong>
                                <br />
                                <Muted>Cada parcela já nasce com seu boleto. Parcelas com vencimento passado ficam sem boleto.</Muted>
                            </span>
                        </label>

                        {values.emitirBoletos && (
                            <div style={{ marginTop: 14 }}>
                                {vencimentoPassado && (
                                    <p style={{ marginBottom: 10 }}>
                                        <Badge $tone="warning">Primeira parcela já venceu</Badge> <Muted>Ela não terá boleto; as demais sim.</Muted>
                                    </p>
                                )}
                                <OpcoesBoletoCampos valores={values} />
                            </div>
                        )}
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
}
