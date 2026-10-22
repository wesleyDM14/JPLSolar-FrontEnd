import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationTriangle, FaFilePdf, FaTimesCircle } from 'react-icons/fa';
import { errorMessage } from '../../api/client';
import { muckApi, openFileInTab } from '../../api/resources';
import { Badge, Button, Dialog, ErrorBlock, LoadingBlock, Muted, tokens } from '../../ui';
import { formatDate } from '../../utils/masks';
import { brl, horasTexto } from './format';

const { colors } = tokens;

const RESULTADO = {
    EMITIDA: { label: 'Nota emitida', tone: 'success', icon: <FaCheckCircle /> },
    REJEITADA: { label: 'Rejeitada pela prefeitura', tone: 'danger', icon: <FaTimesCircle /> },
    PENDENTE: { label: 'Em processamento', tone: 'warning', icon: <FaExclamationTriangle /> },
    ERRO: { label: 'Falha no envio', tone: 'danger', icon: <FaTimesCircle /> },
    NAO_PROCESSADA: { label: 'Não processada', tone: 'neutral', icon: <FaExclamationTriangle /> },
};

const Cartao = ({ children, tom }) => (
    <div style={{ border: `1px solid ${tom === 'erro' ? colors.danger : colors.border}`, borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 6 }}>{children}</div>
);

const verEspelho = (id) => openFileInTab(() => muckApi.espelho(id), 'espelho.pdf', 'Gerando espelho da nota…').catch((erro) => toast.error(errorMessage(erro)));

/**
 * Emissão de NFS-e em três passos, sem atalho: 1) revisão, com o espelho de cada nota; 2) confirmação do lote
 * (quantidade e total) com um aceite explícito; 3) resultado. Nada é enviado à prefeitura antes do passo 2.
 */
export default function NotasDialog({ open, ids, onClose, onDone }) {
    const queryClient = useQueryClient();
    const [passo, setPasso] = useState('revisao');
    const [conferi, setConferi] = useState(false);
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        if (open) {
            setPasso('revisao');
            setConferi(false);
            setResultado(null);
        }
    }, [open]);

    const revisao = useQuery({
        queryKey: ['muck', 'revisao-notas', ids],
        queryFn: () => muckApi.revisarNotas(ids),
        enabled: open && ids.length > 0,
        staleTime: 0,
        gcTime: 0,
    });

    const emitir = useMutation({
        mutationFn: muckApi.emitirNotas,
        onSuccess: async (dados) => {
            setResultado(dados);
            setPasso('resultado');
            await queryClient.invalidateQueries({ queryKey: ['muck'] });
            await queryClient.invalidateQueries({ queryKey: ['fiscal'] });
            onDone?.(dados);
        },
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    if (!open) return null;

    const dados = revisao.data;
    const prontos = dados?.itens.filter((i) => i.pronto) ?? [];
    const comProblema = dados?.itens.filter((i) => !i.pronto) ?? [];
    const producao = dados?.ambiente === 'PRODUCAO';
    const bloqueado = emitir.isPending;

    const confirmar = () =>
        emitir.mutate({ ids: prontos.map((i) => i.operacaoId), confirmado: true, quantidadeConfirmada: dados.quantidadeProntos, totalConfirmado: dados.totalProntos });

    const rodape =
        passo === 'revisao' ? (
            <>
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button disabled={!dados || prontos.length === 0} onClick={() => setPasso('confirmacao')}>
                    Continuar ({prontos.length} {prontos.length === 1 ? 'nota' : 'notas'})
                </Button>
            </>
        ) : passo === 'confirmacao' ? (
            <>
                <Button variant="secondary" disabled={bloqueado} onClick={() => setPasso('revisao')}>Voltar e rever</Button>
                <Button loading={bloqueado} disabled={!conferi} onClick={confirmar}>
                    {bloqueado ? 'Emitindo…' : `Emitir ${dados?.quantidadeProntos} ${dados?.quantidadeProntos === 1 ? 'nota' : 'notas'} — ${brl(dados?.totalProntos)}`}
                </Button>
            </>
        ) : (
            <Button onClick={onClose}>Fechar</Button>
        );

    return (
        <Dialog
            open={open}
            width={760}
            onClose={bloqueado ? undefined : onClose}
            title={passo === 'revisao' ? 'Revisar notas antes de emitir' : passo === 'confirmacao' ? 'Confirmar a emissão' : 'Resultado da emissão'}
            subtitle={passo === 'revisao' ? 'Confira o espelho de cada nota. Nada foi enviado à prefeitura.' : undefined}
            footer={rodape}
        >
            {revisao.isLoading && <LoadingBlock label="Conferindo os serviços…" />}
            {revisao.isError && <ErrorBlock message={errorMessage(revisao.error)} onRetry={revisao.refetch} />}

            {dados && passo === 'revisao' && (
                <div style={{ display: 'grid', gap: 10 }}>
                    {dados.itens.map((i) => (
                        <Cartao key={i.operacaoId} tom={i.pronto ? undefined : 'erro'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ minWidth: 0 }}>
                                    <strong>{i.cliente}</strong>
                                    <div><Muted>{formatDate(i.data)} · {i.destino} · {horasTexto(i.horas)}</Muted></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <strong>{brl(i.valor)}</strong>
                                    {i.pronto ? (
                                        <Button size="sm" variant="secondary" icon={<FaFilePdf />} onClick={() => verEspelho(i.operacaoId)}>Ver espelho</Button>
                                    ) : (
                                        <Badge $tone="danger">Não pode emitir</Badge>
                                    )}
                                </div>
                            </div>
                            <Muted style={{ fontSize: '0.85rem' }}>{i.discriminacao}</Muted>
                            {i.problemas.map((p) => <div key={p} style={{ color: colors.danger, fontSize: '0.88rem' }}>• {p}</div>)}
                        </Cartao>
                    ))}
                    {comProblema.length > 0 && prontos.length > 0 && (
                        <Muted>Os serviços com pendência ficam de fora desta emissão; corrija-os e emita depois.</Muted>
                    )}
                </div>
            )}

            {dados && passo === 'confirmacao' && (
                <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ padding: 16, borderRadius: 12, background: producao ? colors.warningBg : colors.infoBg, display: 'grid', gap: 6 }}>
                        <strong style={{ fontSize: '1.05rem' }}>
                            {dados.quantidadeProntos} {dados.quantidadeProntos === 1 ? 'nota' : 'notas'} · {brl(dados.totalProntos)}
                        </strong>
                        <span>
                            {producao
                                ? 'Ambiente de PRODUÇÃO: as notas serão emitidas de verdade na prefeitura e passam a valer fiscalmente. Depois só podem ser canceladas.'
                                : 'Ambiente de homologação (teste): as notas não têm valor fiscal.'}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                        {prontos.map((i) => (
                            <div key={i.operacaoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                <span>{i.cliente} <Muted>· {formatDate(i.data)}</Muted></span>
                                <strong>{brl(i.valor)}</strong>
                            </div>
                        ))}
                    </div>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 600 }}>
                        <input type="checkbox" checked={conferi} onChange={(e) => setConferi(e.target.checked)} style={{ marginTop: 4 }} />
                        Conferi os espelhos, os clientes e os valores e quero emitir {dados.quantidadeProntos === 1 ? 'esta nota' : 'estas notas'}.
                    </label>
                </div>
            )}

            {passo === 'resultado' && resultado && (
                <div style={{ display: 'grid', gap: 10 }}>
                    <strong>{resultado.emitidas} de {resultado.resultados.length} {resultado.resultados.length === 1 ? 'nota emitida' : 'notas emitidas'}.</strong>
                    {resultado.resultados.map((r) => {
                        const info = RESULTADO[r.resultado] ?? RESULTADO.ERRO;
                        return (
                            <Cartao key={r.operacaoId} tom={r.resultado === 'EMITIDA' ? undefined : 'erro'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span><strong>{r.cliente}</strong>{r.numero ? <Muted> · NFS-e nº {r.numero}</Muted> : null}</span>
                                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <Badge $tone={info.tone}>{info.icon}{info.label}</Badge>
                                        {r.resultado === 'EMITIDA' && <Button size="sm" variant="secondary" icon={<FaFilePdf />} onClick={() => verEspelho(r.operacaoId)}>Ver nota</Button>}
                                    </span>
                                </div>
                                {r.mensagens.map((m) => <div key={m} style={{ color: colors.danger, fontSize: '0.88rem' }}>• {m}</div>)}
                                {r.resultado === 'PENDENTE' && <Muted>Consulte a nota em Financeiro &gt; Fiscal antes de tentar de novo.</Muted>}
                            </Cartao>
                        );
                    })}
                </div>
            )}
        </Dialog>
    );
}
