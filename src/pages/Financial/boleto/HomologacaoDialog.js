import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaExclamationTriangle, FaMinusCircle, FaTimesCircle } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../../api/client';
import { sicrediApi } from '../../../api/resources';
import { Badge, Button, Dialog, FilterInput, Grid, Muted, StatCard, StatGrid, tokens } from '../../../ui';
import { dataHoraBr } from '../../../utils/datas';

const { colors } = tokens;

const PADROES = {
    apiKey: '',
    usuario: '123456789',
    senha: 'teste123',
    cooperativa: '6789',
    posto: '03',
    codigoBeneficiario: '12345',
    cpfPagador: '',
};

const ICONE = {
    OK: <FaCheckCircle style={{ color: 'var(--c-success)' }} />,
    FALHA: <FaTimesCircle style={{ color: 'var(--c-danger)' }} />,
    AVISO: <FaExclamationTriangle style={{ color: 'var(--c-warning)' }} />,
    PULADO: <FaMinusCircle style={{ color: 'var(--c-muted)' }} />,
};

const TOM = { OK: 'success', FALHA: 'danger', AVISO: 'warning', PULADO: 'neutral' };

const Lista = styled.ol`
    list-style: none;
    margin: 0;
    padding: 0;
`;

const Item = styled.li`
    border: 1px solid ${colors.border};
    border-radius: 12px;
    margin-bottom: 8px;
    background: ${colors.surface};
    overflow: hidden;

    > button {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
    }

    .titulo {
        font-weight: 700;
    }

    .mensagem {
        font-size: 0.86rem;
        color: ${colors.muted};
        word-break: break-word;
    }

    .detalhes {
        padding: 0 12px 12px 38px;
    }

    pre {
        margin: 6px 0 0;
        padding: 8px 10px;
        max-height: 220px;
        overflow: auto;
        border-radius: 8px;
        background: ${colors.surfaceAlt};
        border: 1px solid ${colors.border};
        font-size: 0.76rem;
        white-space: pre-wrap;
        word-break: break-word;
    }
`;

function relatorioEmTexto(r) {
    const linhas = [
        `Homologação API de Cobrança Sicredi — ${dataHoraBr(r.executadoEm)}`,
        `Ambiente: ${r.ambiente} · cooperativa ${r.cooperativa} · posto ${r.posto} · beneficiário ${r.codigoBeneficiario}`,
        `Resumo: ${r.resumo.ok} OK, ${r.resumo.avisos} aviso(s), ${r.resumo.falhas} falha(s), ${r.resumo.pulados} pulado(s)`,
        '',
    ];

    for (const passo of r.passos) {
        linhas.push(`[${passo.status}] ${passo.titulo} (${passo.ms} ms)`, `    ${passo.mensagem}`);
        for (const chamada of passo.chamadas) {
            linhas.push(`    → ${chamada.metodo} ${chamada.url} ${chamada.status ?? ''}`.trimEnd());
            if (chamada.corpo !== undefined) linhas.push(`      enviado: ${JSON.stringify(chamada.corpo)}`);
            if (chamada.resposta !== undefined) linhas.push(`      recebido: ${typeof chamada.resposta === 'string' ? chamada.resposta : JSON.stringify(chamada.resposta)}`);
        }
        linhas.push('');
    }

    return linhas.join('\n');
}

/**
 * Roteiro de testes no sandbox (homologação) do Sicredi: autentica, emite, consulta, imprime, instrui e baixa
 * um boleto de teste. Os dados informados aqui não são salvos e nenhum boleto real é emitido.
 */
export default function HomologacaoDialog({ onClose }) {
    const [dados, setDados] = useState(PADROES);
    const [abertos, setAbertos] = useState({});

    const executar = useMutation({
        mutationFn: () => sicrediApi.homologacao({ ...dados, cpfPagador: dados.cpfPagador || undefined }),
        onError: (erro) => toast.error(errorMessage(erro)),
    });

    const resultado = executar.data;
    const set = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));
    const alternar = (id) => setAbertos((atual) => ({ ...atual, [id]: !atual[id] }));

    return (
        <Dialog
            open
            width={820}
            title="Testar no sandbox (homologação)"
            subtitle="Roda as operações da API de Cobrança com um boleto de teste. Nada é salvo e nenhum boleto real é emitido."
            onClose={onClose}
            footer={
                <>
                    {resultado && (
                        <Button
                            variant="ghost"
                            onClick={() => navigator.clipboard?.writeText(relatorioEmTexto(resultado)).then(() => toast.success('Relatório copiado.'))}
                        >
                            Copiar relatório
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                    <Button loading={executar.isPending} disabled={dados.apiKey.trim().length < 8} onClick={() => executar.mutate()}>
                        {resultado ? 'Executar de novo' : 'Executar testes'}
                    </Button>
                </>
            }
        >
            <Grid $cols={2}>
                <FilterInput label="Chave da API do sandbox (x-api-key)" type="password" autoComplete="off" placeholder="Token da app de homologação" value={dados.apiKey} onChange={set('apiKey')} />
                <FilterInput label="CPF do pagador de teste (opcional)" value={dados.cpfPagador} onChange={set('cpfPagador')} placeholder="Um CPF válido" />
                <FilterInput label="Usuário" value={dados.usuario} onChange={set('usuario')} />
                <FilterInput label="Código de acesso (senha)" type="password" autoComplete="off" value={dados.senha} onChange={set('senha')} />
                <FilterInput label="Cooperativa" value={dados.cooperativa} onChange={set('cooperativa')} />
                <FilterInput label="Posto" value={dados.posto} onChange={set('posto')} />
                <FilterInput label="Código do beneficiário" value={dados.codigoBeneficiario} onChange={set('codigoBeneficiario')} />
            </Grid>
            <p style={{ marginTop: 8 }}>
                <Muted>
                    Os valores já preenchidos são os do sandbox do manual (usuário 123456789, senha teste123, cooperativa 6789, posto 03, beneficiário 12345).
                    A chave é a do app de homologação no portal do desenvolvedor.
                </Muted>
            </p>

            {resultado && (
                <div style={{ marginTop: 18 }}>
                    <StatGrid>
                        <StatCard icon={FaCheckCircle} tom="green" rotulo="Passaram" valor={resultado.resumo.ok} />
                        <StatCard icon={FaTimesCircle} tom={resultado.resumo.falhas > 0 ? 'red' : 'gray'} rotulo="Falharam" valor={resultado.resumo.falhas} />
                        <StatCard icon={FaExclamationTriangle} tom={resultado.resumo.avisos > 0 ? 'orange' : 'gray'} rotulo="Avisos" valor={resultado.resumo.avisos} />
                        <StatCard icon={FaMinusCircle} tom="gray" rotulo="Pulados" valor={resultado.resumo.pulados} />
                    </StatGrid>

                    <Lista style={{ marginTop: 12 }}>
                        {resultado.passos.map((passo) => {
                            const aberto = Boolean(abertos[passo.id]);
                            const temDetalhes = passo.chamadas.length > 0;
                            return (
                                <Item key={passo.id}>
                                    <button type="button" onClick={() => temDetalhes && alternar(passo.id)} style={{ cursor: temDetalhes ? 'pointer' : 'default' }}>
                                        <span style={{ marginTop: 3 }}>{ICONE[passo.status]}</span>
                                        <span style={{ flex: 1 }}>
                                            <span className="titulo">{passo.titulo}</span>{' '}
                                            <Badge $tone={TOM[passo.status]}>{passo.status}</Badge>
                                            <div className="mensagem">{passo.mensagem}</div>
                                        </span>
                                        {passo.ms > 0 && <Muted>{passo.ms} ms</Muted>}
                                        {temDetalhes && (aberto ? <FaChevronDown /> : <FaChevronRight />)}
                                    </button>
                                    {aberto && temDetalhes && (
                                        <div className="detalhes">
                                            {passo.chamadas.map((c, indice) => (
                                                <div key={`${passo.id}-${indice}`}>
                                                    <strong>{c.metodo}</strong> <code>{c.url}</code> {c.status !== undefined && <Badge $tone={c.status < 300 ? 'success' : 'danger'}>{c.status}</Badge>}
                                                    {c.corpo !== undefined && <pre>{JSON.stringify(c.corpo, null, 2)}</pre>}
                                                    {c.resposta !== undefined && <pre>{typeof c.resposta === 'string' ? c.resposta : JSON.stringify(c.resposta, null, 2)}</pre>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Item>
                            );
                        })}
                    </Lista>
                </div>
            )}
        </Dialog>
    );
}
