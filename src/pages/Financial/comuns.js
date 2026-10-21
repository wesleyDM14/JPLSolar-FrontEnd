import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';
import styled from 'styled-components';
import { errorMessage } from '../../api/client';
import { financeiroApi, openFileInTab, saveResponse } from '../../api/resources';
import { Button, FilterInput, FilterSelect, tokens } from '../../ui';
import { anoAtual, mesAtual, somarMesesChave } from '../../utils/datas';

const { colors } = tokens;

// ── Período (mês inicial e final) ─────────────────────────────────────────────

export { mesAtual, somarMesesChave } from '../../utils/datas';

const Linha = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: ${tokens.shadow};

    > * {
        min-width: 150px;
    }

    .espaco {
        flex: 1;
    }
`;

export const BarraDeFiltros = Linha;

/** Atalhos de período (em meses, AAAA-MM). `futuro` inclui os próximos meses, útil no fluxo de caixa. */
export function periodosRapidos(futuro = false) {
    const atual = mesAtual();
    const ano = anoAtual();
    const lista = [
        { id: 'mes', rotulo: 'Este mês', de: atual, ate: atual },
        { id: 'mes-passado', rotulo: 'Mês passado', de: somarMesesChave(atual, -1), ate: somarMesesChave(atual, -1) },
        { id: '3m', rotulo: 'Últimos 3 meses', de: somarMesesChave(atual, -2), ate: atual },
        { id: '6m', rotulo: 'Últimos 6 meses', de: somarMesesChave(atual, -5), ate: atual },
        { id: '12m', rotulo: 'Últimos 12 meses', de: somarMesesChave(atual, -11), ate: atual },
        { id: 'ano', rotulo: `Este ano (${ano})`, de: `${ano}-01`, ate: `${ano}-12` },
        { id: 'ano-passado', rotulo: `Ano passado (${ano - 1})`, de: `${ano - 1}-01`, ate: `${ano - 1}-12` },
    ];
    if (futuro) lista.push({ id: 'prox6', rotulo: 'Próximos 6 meses', de: atual, ate: somarMesesChave(atual, 5) });
    return lista;
}

/** Período padrão das telas de análise: o ano corrente. */
export const periodoDoAno = () => ({ de: `${anoAtual()}-01`, ate: `${anoAtual()}-12` });

export function PeriodoFiltro({ de, ate, onChange, regime, onRegime, extra, futuro = false }) {
    const rapidos = periodosRapidos(futuro);
    const atual = rapidos.find((item) => item.de === de && item.ate === ate);

    return (
        <Linha>
            <FilterSelect
                label="Período"
                value={atual?.id ?? ''}
                placeholder="Personalizado"
                onChange={(e) => {
                    const escolhido = rapidos.find((item) => item.id === e.target.value);
                    if (escolhido) onChange({ de: escolhido.de, ate: escolhido.ate });
                }}
                options={rapidos.map((item) => ({ value: item.id, label: item.rotulo }))}
            />
            <FilterInput label="De" type="month" value={de} onChange={(e) => onChange({ de: e.target.value || de, ate })} />
            <FilterInput label="Até" type="month" value={ate} onChange={(e) => onChange({ de, ate: e.target.value || ate })} />
            {onRegime && (
                <FilterSelect
                    label="Regime"
                    value={regime}
                    placeholder={null}
                    onChange={(e) => onRegime(e.target.value || 'competencia')}
                    options={[
                        { value: 'competencia', label: 'Competência (por vencimento)' },
                        { value: 'caixa', label: 'Caixa (por pagamento)' },
                    ]}
                />
            )}
            <div className="espaco" />
            {extra}
        </Linha>
    );
}

// ── Exportações ──────────────────────────────────────────────────────────────

/** Botões CSV/PDF de um relatório do servidor. PDF abre em nova aba; CSV baixa o arquivo. */
export function ExportButtons({ tipo, params }) {
    const [carregando, setCarregando] = useState('');

    const exportar = async (formato) => {
        setCarregando(formato);
        try {
            if (formato === 'pdf') {
                await openFileInTab(() => financeiroApi.relatorioArquivo(tipo, params, 'pdf'), `${tipo}.pdf`, 'Gerando relatório…');
            } else {
                const resposta = await financeiroApi.relatorioArquivo(tipo, params, 'csv');
                saveResponse(resposta, `${tipo}.csv`);
            }
        } catch (erro) {
            toast.error(errorMessage(erro, 'Não foi possível gerar o relatório.'));
        } finally {
            setCarregando('');
        }
    };

    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<FaFileCsv />} loading={carregando === 'csv'} onClick={() => exportar('csv')}>CSV</Button>
            <Button variant="secondary" icon={<FaFilePdf />} loading={carregando === 'pdf'} onClick={() => exportar('pdf')}>PDF</Button>
        </div>
    );
}

export const pct = (valor) => (valor === null || valor === undefined ? '—' : `${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
export const num = (valor, casas = 2) => (valor === null || valor === undefined ? '—' : Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: casas }));
