import { useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { tokens } from './tokens';

const { colors } = tokens;

// ── Animações compartilhadas ─────────────────────────────────────────────────

export const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const pop = keyframes`
    0% { transform: scale(0.85); opacity: 0; }
    60% { transform: scale(1.04); opacity: 1; }
    100% { transform: scale(1); }
`;

export const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.45); }
    70% { box-shadow: 0 0 0 9px rgba(211, 47, 47, 0); }
    100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
`;

export const shimmer = keyframes`
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
`;

/** Entrada suave de uma página/bloco; `$delay` em ms escalona vários itens. */
export const Reveal = styled.div`
    animation: ${fadeUp} 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: ${({ $delay = 0 }) => $delay}ms;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

// ── Paleta de destaques ──────────────────────────────────────────────────────

// Cada tom tem uma cor forte, um fundo suave e um degradê para ícones/cabeçalhos.
export const palette = {
    red: { fg: 'var(--p-red-fg)', bg: 'var(--p-red-bg)', grad: 'linear-gradient(135deg, #E53935, #B71C1C)' },
    green: { fg: 'var(--p-green-fg)', bg: 'var(--p-green-bg)', grad: 'linear-gradient(135deg, #43A047, #1B5E20)' },
    blue: { fg: 'var(--p-blue-fg)', bg: 'var(--p-blue-bg)', grad: 'linear-gradient(135deg, #1E88E5, #0D47A1)' },
    orange: { fg: 'var(--p-orange-fg)', bg: 'var(--p-orange-bg)', grad: 'linear-gradient(135deg, #FB8C00, #E65100)' },
    purple: { fg: 'var(--p-purple-fg)', bg: 'var(--p-purple-bg)', grad: 'linear-gradient(135deg, #8E24AA, #4A148C)' },
    teal: { fg: 'var(--p-teal-fg)', bg: 'var(--p-teal-bg)', grad: 'linear-gradient(135deg, #00897B, #004D40)' },
    gray: { fg: 'var(--p-gray-fg)', bg: 'var(--p-gray-bg)', grad: 'linear-gradient(135deg, #78909C, #37474F)' },
};

export const tone = (name = 'gray') => palette[name] ?? palette.gray;

/** Quadrado arredondado com ícone em degradê. */
export const IconChip = styled.span`
    flex: none;
    display: inline-grid;
    place-items: center;
    width: ${({ $size = 40 }) => $size}px;
    height: ${({ $size = 40 }) => $size}px;
    border-radius: ${({ $size = 40 }) => Math.round($size * 0.3)}px;
    font-size: ${({ $size = 40 }) => Math.round($size * 0.5)}px;
    color: ${({ $soft, $tone = 'red' }) => ($soft ? tone($tone).fg : '#fff')};
    background: ${({ $soft, $tone = 'red' }) => ($soft ? tone($tone).bg : tone($tone).grad)};
    box-shadow: ${({ $soft, $tone = 'red' }) => ($soft ? 'none' : `0 6px 14px color-mix(in srgb, ${tone($tone).fg} 22%, transparent)`)};
`;

/** Círculo com iniciais (avatar de cliente/usuário). Cor derivada do nome. */
const AVATAR_TONES = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];

const hashNome = (nome = '') => [...nome].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 7);

export function iniciais(nome = '') {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '?') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

const AvatarBox = styled.span`
    flex: none;
    display: inline-grid;
    place-items: center;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 50%;
    background: ${({ $tone }) => tone($tone).grad};
    color: #fff;
    font-weight: 700;
    font-size: ${({ $size }) => Math.round($size * 0.38)}px;
    font-family: 'Montserrat', sans-serif;
    letter-spacing: 0.02em;
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

/** Iniciais sobre fundo colorido; com `src` mostra a foto. */
export function Avatar({ nome, size = 36, src }) {
    return (
        <AvatarBox $size={size} $tone={AVATAR_TONES[hashNome(nome) % AVATAR_TONES.length]} aria-hidden>
            {src ? <img src={src} alt="" /> : iniciais(nome)}
        </AvatarBox>
    );
}

// ── Cartões de indicador ─────────────────────────────────────────────────────

export const StatGrid = styled.div`
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    margin-bottom: 18px;
`;

const StatBox = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: ${colors.surface};
    border-radius: 16px;
    border: 1px solid ${colors.border};
    box-shadow: ${tokens.shadow};
    overflow: hidden;
    animation: ${fadeUp} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: ${({ $delay }) => $delay}ms;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;

    ${({ $clickable }) => $clickable && css`
        cursor: pointer;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
        }
    `}

    ${({ $active, $tone }) => $active && css`
        border-color: ${tone($tone).fg};
        box-shadow: 0 0 0 2px color-mix(in srgb, ${tone($tone).fg} 22%, transparent);
    `}

    /* fio de cor ao fundo do cartão */
    &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: ${({ $tone }) => tone($tone).grad};
        opacity: 0.85;
    }

    .texto {
        min-width: 0;
    }

    .rotulo {
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: ${colors.muted};
    }

    .valor {
        margin-top: 1px;
        font-size: 1.55rem;
        font-weight: 800;
        line-height: 1.15;
        font-family: 'Montserrat', sans-serif;
        color: ${colors.text};
        font-variant-numeric: tabular-nums;
    }

    .detalhe {
        margin-top: 2px;
        font-size: 0.8rem;
        color: ${colors.muted};
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

/** Número que "sobe" até o valor final. Respeita prefers-reduced-motion. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('pt-BR'), duration = 700 }) {
    const alvo = Number(value) || 0;
    const [atual, setAtual] = useState(alvo);
    const anterior = useRef(alvo);

    useEffect(() => {
        const semAnimacao = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (semAnimacao || typeof requestAnimationFrame === 'undefined') {
            setAtual(alvo);
            anterior.current = alvo;
            return undefined;
        }

        const inicio = anterior.current;
        const t0 = performance.now();
        let frame;

        const passo = (agora) => {
            const progresso = Math.min(1, (agora - t0) / duration);
            const suave = 1 - (1 - progresso) ** 3;
            setAtual(inicio + (alvo - inicio) * suave);
            if (progresso < 1) frame = requestAnimationFrame(passo);
            else anterior.current = alvo;
        };

        frame = requestAnimationFrame(passo);
        return () => cancelAnimationFrame(frame);
    }, [alvo, duration]);

    return <>{format(atual)}</>;
}

/**
 * Indicador com ícone. `valor` pode ser texto pronto ou número (com `formato` e animação de contagem).
 * Com `onClick` vira atalho (ex.: filtrar a lista) e `ativo` destaca o cartão selecionado.
 */
export function StatCard({ icon: Icon, rotulo, valor, formato, detalhe, tom = 'blue', onClick, ativo, delay = 0 }) {
    return (
        <StatBox
            $tone={tom}
            $delay={delay}
            $clickable={Boolean(onClick)}
            $active={ativo}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (evento) => (evento.key === 'Enter' || evento.key === ' ') && onClick() : undefined}
        >
            {Icon && <IconChip $tone={tom} $size={46}><Icon /></IconChip>}
            <div className="texto">
                <div className="rotulo">{rotulo}</div>
                <div className="valor">
                    {typeof valor === 'number' ? <CountUp value={valor} format={formato} /> : valor}
                </div>
                {detalhe && <div className="detalhe">{detalhe}</div>}
            </div>
        </StatBox>
    );
}

/** Título de seção com ícone, para cartões. */
const SectionTitleBox = styled.h2`
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 14px;
    font-size: 1.02rem;
    color: ${colors.text};
`;

export function SectionTitle({ icon: Icon, tom = 'red', children, aside }) {
    return (
        <SectionTitleBox>
            {Icon && <IconChip $soft $tone={tom} $size={30}><Icon /></IconChip>}
            <span style={{ flex: 1 }}>{children}</span>
            {aside}
        </SectionTitleBox>
    );
}

/** Marcador de status com ponto colorido (e pulso opcional para algo que exige atenção). */
export const Dot = styled.span`
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${({ $tone = 'gray' }) => tone($tone).fg};
    ${({ $pulse }) => $pulse && css`animation: ${pulse} 1.8s infinite;`}
`;

/** Esqueleto de carregamento (linhas cinza animadas). */
export const Skeleton = styled.div`
    height: ${({ $h = 16 }) => $h}px;
    width: ${({ $w = '100%' }) => $w};
    border-radius: 8px;
    background: linear-gradient(90deg, var(--c-neutral-bg) 25%, var(--c-surface-alt) 50%, var(--c-neutral-bg) 75%);
    background-size: 800px 100%;
    animation: ${shimmer} 1.3s infinite linear;
`;


// ── Cabeçalho de detalhe ─────────────────────────────────────────────────────

const HeroBox = styled.section`
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    padding: 20px 22px;
    margin-bottom: 18px;
    border-radius: 18px;
    border: 1px solid ${colors.border};
    background:
        radial-gradient(520px 180px at 0% 0%, color-mix(in srgb, ${({ $tone }) => tone($tone).fg} 16%, transparent), transparent 70%),
        ${colors.surface};
    box-shadow: ${tokens.shadow};
    overflow: hidden;
    animation: ${fadeUp} 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;

    .identidade {
        flex: 1;
        min-width: 240px;
    }

    .titulo {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
        font-family: 'Montserrat', sans-serif;
        color: ${colors.text};
        word-break: break-word;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
    }

    .indicadores {
        display: flex;
        gap: 22px;
        flex-wrap: wrap;
    }

    .indicador {
        min-width: 90px;
    }

    .indicador small {
        display: block;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: ${colors.muted};
    }

    .indicador strong {
        font-size: 1.2rem;
        font-family: 'Montserrat', sans-serif;
        font-variant-numeric: tabular-nums;
    }
`;

/** Cabeçalho das telas de detalhe: avatar/ícone, título, selos e indicadores-chave. */
export function DetalheHero({ nome, icon: Icon, avatar = false, tom = 'blue', chips, indicadores = [], children }) {
    return (
        <HeroBox $tone={tom}>
            {avatar ? <Avatar nome={nome} size={64} /> : Icon && <IconChip $tone={tom} $size={64}><Icon /></IconChip>}
            <div className="identidade">
                <h2 className="titulo">{nome}</h2>
                {chips && <div className="chips">{chips}</div>}
            </div>
            {indicadores.length > 0 && (
                <div className="indicadores">
                    {indicadores.map((item) => (
                        <div className="indicador" key={item.rotulo}>
                            <small>{item.rotulo}</small>
                            <strong style={item.cor ? { color: item.cor } : undefined}>{item.valor}</strong>
                        </div>
                    ))}
                </div>
            )}
            {children}
        </HeroBox>
    );
}
