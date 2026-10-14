import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FaBalanceScale, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styled, { css } from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi } from '../../api/resources';
import { ErrorBlock, LoadingBlock, Muted, Page, PageHeader, tokens } from '../../ui';
import { ExportButtons, PeriodoFiltro, periodoDoAno } from './comuns';
import { brl, mesCurto } from './format';

const { colors } = tokens;

const Tabela = styled.div`
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};
    overflow-x: auto;

    table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
    }

    th {
        position: sticky;
        top: 0;
        padding: 12px 14px;
        text-align: right;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: ${colors.muted};
        background: ${colors.surfaceAlt};
        border-bottom: 1px solid ${colors.border};
        white-space: nowrap;
    }

    th:first-child {
        text-align: left;
        left: 0;
        z-index: 2;
    }

    td {
        padding: 10px 14px;
        text-align: right;
        border-bottom: 1px solid ${colors.border};
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    td:first-child {
        text-align: left;
        position: sticky;
        left: 0;
        background: inherit;
        z-index: 1;
    }
`;

const Linha = styled.tr`
    background: ${colors.surface};

    ${({ $tipo }) => $tipo === 'grupo' && css`
        font-weight: 700;
        cursor: pointer;

        &:hover {
            background: ${colors.rowHover};
        }
    `}

    ${({ $tipo }) => $tipo === 'categoria' && css`
        background: ${colors.surfaceAlt};
        color: ${colors.muted};
        font-size: 0.9rem;

        td:first-child {
            padding-left: 42px;
        }
    `}

    ${({ $tipo, $tom }) => $tipo === 'resultado' && css`
        font-weight: 800;
        background: ${$tom === 'final' ? colors.infoBg : colors.surfaceAlt};
        border-top: 2px solid ${colors.border};
    `}

    .seta {
        display: inline-block;
        width: 18px;
        color: ${colors.muted};
        font-size: 0.75em;
    }
`;

const Negativo = styled.span`
    color: ${({ $negativo }) => ($negativo ? colors.danger : 'inherit')};
`;

const SINAL_GRUPO = { DEDUCOES: -1, CUSTOS: -1, DESPESAS_OPERACIONAIS: -1, DESPESAS_FINANCEIRAS: -1, IMPOSTOS_LUCRO: -1 };

/** DRE em colunas mensais, com detalhe por categoria (clique no grupo) e percentual sobre a receita. */
export default function Dre() {
    const [periodo, setPeriodo] = useState(periodoDoAno);
    const [regime, setRegime] = useState('competencia');
    const [abertos, setAbertos] = useState({});

    const parametros = { ...periodo, regime };
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['financeiro', 'dre', parametros],
        queryFn: () => financeiroApi.dre(parametros),
    });

    const linhas = useMemo(() => {
        if (!data) return [];
        const grupo = (id) => data.grupos.find((g) => g.grupo === id);
        const r = data.resultados;
        const receitaTotal = grupo('RECEITA_BRUTA').total;

        const linhaGrupo = (g) => ({ tipo: 'grupo', chave: g.grupo, rotulo: g.rotulo, valores: g.valores, total: g.total, sinal: SINAL_GRUPO[g.grupo] ?? 1, categorias: g.categorias });
        const linhaResultado = (chave, rotulo, resultado, final = false) => ({ tipo: 'resultado', tom: final ? 'final' : 'parcial', chave, rotulo, valores: resultado.valores, total: resultado.total, sinal: 1 });

        return {
            receitaTotal,
            itens: [
                linhaGrupo(grupo('RECEITA_BRUTA')),
                linhaGrupo(grupo('DEDUCOES')),
                linhaResultado('rl', '(=) Receita líquida', r.receitaLiquida),
                linhaGrupo(grupo('CUSTOS')),
                linhaResultado('lb', '(=) Lucro bruto', r.lucroBruto),
                linhaGrupo(grupo('DESPESAS_OPERACIONAIS')),
                linhaResultado('ebitda', '(=) EBITDA', r.ebitda),
                linhaGrupo(grupo('RECEITAS_FINANCEIRAS')),
                linhaGrupo(grupo('DESPESAS_FINANCEIRAS')),
                linhaGrupo(grupo('IMPOSTOS_LUCRO')),
                linhaResultado('ll', '(=) Lucro líquido', r.lucroLiquido, true),
            ],
        };
    }, [data]);

    const alternar = (chave) => setAbertos((atual) => ({ ...atual, [chave]: !atual[chave] }));
    const celula = (valor, sinal = 1) => {
        const v = valor * sinal;
        return <Negativo $negativo={v < 0}>{brl(v)}</Negativo>;
    };
    const percentual = (valor, receita) => (receita === 0 ? '—' : `${((valor / receita) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);

    return (
        <Page>
            <PageHeader
                icon={FaBalanceScale}
                tone="purple"
                title="DRE"
                subtitle="Da receita bruta ao lucro líquido, mês a mês. Clique num grupo para ver as categorias."
            />

            <PeriodoFiltro
                de={periodo.de}
                ate={periodo.ate}
                onChange={setPeriodo}
                regime={regime}
                onRegime={setRegime}
                extra={<ExportButtons tipo="dre" params={parametros} />}
            />

            {error ? (
                <ErrorBlock message={errorMessage(error)} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingBlock />
            ) : (
                <Tabela>
                    <table>
                        <thead>
                            <tr>
                                <th>Conta</th>
                                {data.meses.map((mes) => <th key={mes}>{mesCurto(mes)}</th>)}
                                <th>Total</th>
                                <th>% receita</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.itens.map((linha) => (
                                <FragmentoLinha
                                    key={linha.chave}
                                    linha={linha}
                                    aberto={Boolean(abertos[linha.chave])}
                                    onAlternar={() => alternar(linha.chave)}
                                    celula={celula}
                                    percentual={(valor) => percentual(valor, linhas.receitaTotal)}
                                />
                            ))}
                        </tbody>
                    </table>
                </Tabela>
            )}
            <p style={{ marginTop: 12 }}>
                <Muted>
                    Regime de competência considera o vencimento dos lançamentos; regime de caixa considera apenas o que foi efetivamente pago ou recebido.
                    Defina o grupo de cada categoria em Cadastros → Categorias.
                </Muted>
            </p>
        </Page>
    );
}

function FragmentoLinha({ linha, aberto, onAlternar, celula, percentual }) {
    const detalhe = linha.tipo === 'grupo' && linha.categorias.length > 0;

    return (
        <>
            <Linha $tipo={linha.tipo} $tom={linha.tom} onClick={detalhe ? onAlternar : undefined}>
                <td>
                    {linha.tipo === 'grupo' && <span className="seta">{detalhe ? (aberto ? <FaChevronDown /> : <FaChevronRight />) : ''}</span>}
                    {linha.rotulo}
                </td>
                {linha.valores.map((valor, indice) => <td key={indice}>{celula(valor, linha.sinal)}</td>)}
                <td><strong>{celula(linha.total, linha.sinal)}</strong></td>
                <td>{percentual(linha.total)}</td>
            </Linha>
            {aberto && linha.categorias.map((categoria) => (
                <Linha key={`${linha.chave}-${categoria.id}`} $tipo="categoria">
                    <td>{categoria.nome}</td>
                    {categoria.valores.map((valor, indice) => <td key={indice}>{celula(valor, linha.sinal)}</td>)}
                    <td>{celula(categoria.total, linha.sinal)}</td>
                    <td>{percentual(categoria.total)}</td>
                </Linha>
            ))}
        </>
    );
}
