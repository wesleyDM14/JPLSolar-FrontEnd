import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styled from 'styled-components';
import { tokens } from '../../ui';
import {
    dataBr,
    fimDaSemana,
    fimDoAno,
    fimDoMes,
    hojeIso,
    inicioDaSemana,
    inicioDoAno,
    inicioDoMes,
    mesPorExtenso,
    somarDias,
    somarMeses,
} from '../../utils/datas';

const { colors } = tokens;

const ROTULOS = { hoje: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano', tudo: 'Tudo' };

const Caixa = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
`;

const Segmentos = styled.div`
    display: inline-flex;
    padding: 4px;
    gap: 2px;
    background: ${colors.neutralBg};
    border-radius: 12px;

    button {
        padding: 7px 13px;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: ${colors.muted};
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
    }

    button[aria-pressed='true'] {
        background: ${colors.surface};
        color: ${colors.text};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
`;

const Navegador = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px;
    border: 1px solid ${colors.border};
    border-radius: 12px;
    background: ${colors.surface};

    .rotulo {
        min-width: 150px;
        padding: 0 6px;
        text-align: center;
        font-weight: 700;
        font-size: 0.9rem;
    }

    button {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: ${colors.text};
        cursor: pointer;
    }

    button:hover:not(:disabled) {
        background: ${colors.neutralBg};
    }

    button:disabled {
        opacity: 0.35;
        cursor: default;
    }
`;

/** Identifica o modo (dia, semana, mês, ano, tudo ou personalizado) a partir das datas escolhidas. */
export function detectarModo(de, ate) {
    if (!de && !ate) return 'tudo';
    if (!de || !ate) return 'custom';
    if (de === ate) return 'dia';
    if (de === inicioDaSemana(de) && ate === fimDaSemana(de)) return 'semana';
    if (de === inicioDoMes(de) && ate === fimDoMes(de)) return 'mes';
    if (de === inicioDoAno(de) && ate === fimDoAno(de)) return 'ano';
    return 'custom';
}

function intervalo(modo, base) {
    switch (modo) {
        case 'hoje': return { de: hojeIso(), ate: hojeIso() };
        case 'semana': return { de: inicioDaSemana(base), ate: fimDaSemana(base) };
        case 'mes': return { de: inicioDoMes(base), ate: fimDoMes(base) };
        case 'ano': return { de: inicioDoAno(base), ate: fimDoAno(base) };
        default: return { de: '', ate: '' };
    }
}

function rotuloDe(modo, de, ate) {
    switch (modo) {
        case 'tudo': return 'Todo o período';
        case 'dia': return de === hojeIso() ? `Hoje, ${dataBr(de)}` : dataBr(de);
        case 'semana': return `${dataBr(de).slice(0, 5)} a ${dataBr(ate)}`;
        case 'mes': return mesPorExtenso(de).replace(/^./, (letra) => letra.toUpperCase());
        case 'ano': return de.slice(0, 4);
        default: return `${dataBr(de) || '…'} a ${dataBr(ate) || '…'}`;
    }
}

/**
 * Escolha de período por dia, semana, mês ou ano, com setas para avançar e voltar.
 * Trabalha com datas AAAA-MM-DD (`de`/`ate`) e devolve o novo par em `onChange`.
 */
export default function SeletorPeriodo({ de, ate, onChange, modos = ['hoje', 'semana', 'mes', 'ano', 'tudo'] }) {
    const modo = detectarModo(de, ate);
    const ativo = modo === 'dia' ? 'hoje' : modo;
    const navegavel = ['dia', 'semana', 'mes', 'ano'].includes(modo);

    // Ao trocar o modo, mantém a referência atual (hoje, se estiver dentro do período).
    const hoje = hojeIso();
    const base = de && ate && de <= hoje && hoje <= ate ? hoje : de || hoje;

    const mover = (sentido) => {
        const passos = {
            dia: () => ({ de: somarDias(de, sentido), ate: somarDias(ate, sentido) }),
            semana: () => ({ de: somarDias(de, 7 * sentido), ate: somarDias(ate, 7 * sentido) }),
            mes: () => {
                const proximo = somarMeses(de, sentido);
                return { de: inicioDoMes(proximo), ate: fimDoMes(proximo) };
            },
            ano: () => {
                const proximo = somarMeses(de, 12 * sentido);
                return { de: inicioDoAno(proximo), ate: fimDoAno(proximo) };
            },
        };
        onChange(passos[modo]());
    };

    return (
        <Caixa>
            <Segmentos role="group" aria-label="Período">
                {modos.map((id) => (
                    <button key={id} type="button" aria-pressed={ativo === id} onClick={() => onChange(intervalo(id, base))}>
                        {ROTULOS[id]}
                    </button>
                ))}
            </Segmentos>
            <Navegador>
                <button type="button" aria-label="Período anterior" disabled={!navegavel} onClick={() => mover(-1)}><FaChevronLeft /></button>
                <span className="rotulo">{rotuloDe(modo, de, ate)}</span>
                <button type="button" aria-label="Próximo período" disabled={!navegavel} onClick={() => mover(1)}><FaChevronRight /></button>
            </Navegador>
        </Caixa>
    );
}
