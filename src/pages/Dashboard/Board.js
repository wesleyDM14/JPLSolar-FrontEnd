import { memo, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';

// Paleta do painel (quadro de embarque). Os valores vêm das variáveis --b-* de ui/theme.js:
// no tema escuro é o painel clássico preto; no claro, um painel branco com a mesma hierarquia de cores.
export const boardColors = {
    bg: 'var(--b-bg)',
    panel: 'var(--b-panel)',
    line: 'var(--b-line)',
    tileTop: 'var(--b-tile-top)',
    tileBottom: 'var(--b-tile-bottom)',
    header: 'var(--b-header)',
    text: 'var(--b-text)',
    muted: 'var(--b-muted)',
    ok: 'var(--b-ok)',
    standby: 'var(--b-standby)',
    alert: 'var(--b-alert)',
    danger: 'var(--b-danger)',
    neutral: 'var(--b-neutral)',
};

const toneColor = {
    success: boardColors.ok,
    info: boardColors.standby,
    warning: boardColors.alert,
    danger: boardColors.danger,
    neutral: boardColors.neutral,
};

const flip = keyframes`
    0%   { transform: rotateX(-90deg); opacity: 0; }
    55%  { transform: rotateX(18deg); opacity: 1; }
    100% { transform: rotateX(0deg); opacity: 1; }
`;

const blink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
`;

const reducedMotion = css`
    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

// Largura de cada peça. As colunas do quadro são dimensionadas a partir dela (sem sobreposição).
const TILE_WIDTH = '0.82em';
const TILE_GAP = '2px';

const Tile = styled.span`
    display: inline-block;
    width: ${TILE_WIDTH};
    margin: 0 ${TILE_GAP} 0 0;
    padding: 0.22em 0;
    text-align: center;
    border-radius: 3px;
    /* "emenda" das aletas sem cortar a letra: o tom muda na metade, não há linha sobre o texto */
    background: linear-gradient(to bottom, ${boardColors.tileTop} 0%, ${boardColors.tileTop} 50%, ${boardColors.tileBottom} 50%, ${boardColors.tileBottom} 100%);
    color: ${({ $color }) => $color};
    font-weight: 700;
    transform-origin: 50% 50%;
    animation: ${({ $animate }) => ($animate ? css`${flip} 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both` : 'none')};
    ${reducedMotion}
`;

const Word = styled.span`
    display: inline-flex;
    white-space: nowrap;
`;

const WrapBox = styled.span`
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.9em;
    row-gap: 0.35em;
    min-width: 0;
`;

const FixedBox = styled.span`
    display: inline-flex;
    white-space: nowrap;
`;

const MAX_NAME = 60;

function tilesOf(text, color, animate, delay, offset = 0) {
    return [...text].map((char, index) => (
        <Tile
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            $color={color}
            $animate={animate}
            // O atraso vai inline: como prop do styled-components geraria uma classe CSS por valor.
            style={animate ? { animationDelay: `${delay + (offset + index) * 9}ms` } : undefined}
            aria-hidden="true"
        >
            {char}
        </Tile>
    ));
}

/**
 * Texto em "aletas". Modo fixo: largura constante (preenche com espaços) para as colunas alinharem.
 * Modo `wrap` (nomes): as palavras quebram em outra linha em vez de serem cortadas.
 */
function Flap({ text, width, wrap = false, color = boardColors.text, animate = false, delay = 0 }) {
    const upper = String(text ?? '').toUpperCase();

    if (wrap) {
        const shown = upper.length > MAX_NAME ? `${upper.slice(0, MAX_NAME - 1)}…` : upper;
        let offset = 0;

        return (
            <WrapBox aria-label={String(text ?? '')}>
                {shown.split(/\s+/).filter(Boolean).map((word, index) => {
                    const element = <Word key={`${word}-${offset}`}>{tilesOf(word, color, animate, delay, offset)}</Word>;
                    offset += word.length + 1;
                    return element;
                })}
            </WrapBox>
        );
    }

    const content = upper.slice(0, width).padEnd(width, ' ');

    return (
        <FixedBox aria-label={String(text ?? '')}>
            {tilesOf(content, color, animate, delay).map((tile, index) => (content[index] === ' '
                // Espaço preenchido: ocupa o lugar mas não desenha peça.
                ? <span key={tile.key} style={{ display: 'inline-block', width: `calc(${TILE_WIDTH} + ${TILE_GAP})` }} />
                : tile))}
        </FixedBox>
    );
}

// Larguras (em peças) das colunas de largura fixa.
const COL = { code: 13, inversor: 8, geracao: 11, status: 10 };
const colWidth = (chars) => `calc(${chars} * (${TILE_WIDTH} + ${TILE_GAP}))`;

const Row = styled.button`
    display: grid;
    grid-template-columns:
        1.2em
        ${colWidth(COL.code)}
        minmax(16em, 1fr)
        ${colWidth(COL.inversor)}
        ${colWidth(COL.geracao)}
        ${colWidth(COL.status)};
    align-items: center;
    column-gap: 1.5em;
    width: 100%;
    padding: 0.6em 1em;
    background: transparent;
    border: none;
    border-bottom: 1px solid ${boardColors.line};
    color: ${boardColors.text};
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
        background: var(--b-soft);
    }

    /*
     * Bloco com menos de 1150px (inclusive cada coluna do modo lado a lado): some inversor e geração,
     * a fonte diminui junto com o bloco e o nome ganha o espaço.
     */
    @container (max-width: 1150px) {
        grid-template-columns: 1.2em ${colWidth(COL.code)} minmax(12em, 1fr) ${colWidth(COL.status)};
        column-gap: 1em;
        font-size: clamp(10.5px, 2cqw, 15px);

        & > :nth-child(4),
        & > :nth-child(5) {
            display: none;
        }
    }

    /* Bloco estreito, lista das usinas OK: a bolinha verde já diz "online"; o texto do status some. */
    @container (max-width: 700px) {
        ${({ $hideStatusCompact }) => ($hideStatusCompact
        ? css`
            grid-template-columns: 1.2em ${colWidth(COL.code)} minmax(12em, 1fr);

            & > :nth-child(6) {
                display: none;
            }
        `
        : '')}
    }
`;

const Light = styled.span`
    width: 0.8em;
    height: 0.8em;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 0.7em ${({ $color }) => $color};
    animation: ${({ $blink }) => ($blink ? css`${blink} 1.1s ease-in-out infinite` : 'none')};
    ${reducedMotion}
`;

// Rótulos mais curtos para caber na coluna de largura fixa do quadro.
const SHORT_LABEL = { 'SEM LEITURA': 'S/ LEITURA' };

export const BoardRow = memo(function BoardRow({ usina, status, animate, index, onOpen, hideStatusCompact = false }) {
    const color = toneColor[status.tone];
    const delay = index * 70;
    const geracao = usina.eTotal != null ? `${Number(usina.eTotal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KWH` : '—';

    return (
        <Row type="button" $hideStatusCompact={hideStatusCompact} onClick={() => onOpen(usina.id)} title={`Abrir usina ${usina.code}`}>
            <Light $color={color} $blink={status.tone === 'danger' || status.tone === 'warning'} />
            <Flap text={usina.code} width={COL.code} animate={animate} delay={delay} />
            <Flap text={usina.cliente} wrap animate={animate} delay={delay + 40} />
            <Flap text={usina.inversor} width={COL.inversor} animate={animate} delay={delay + 80} color={boardColors.muted} />
            <Flap text={geracao} width={COL.geracao} animate={animate} delay={delay + 100} color={boardColors.header} />
            <Flap
                text={SHORT_LABEL[status.label.toUpperCase()] ?? status.label}
                width={COL.status}
                animate={animate}
                delay={delay + 140}
                color={color}
            />
        </Row>
    );
});

export const BoardFrame = styled.div`
    background: ${boardColors.bg};
    color: ${boardColors.text};
    min-height: calc(100vh - 60px);
    padding: 18px 22px 28px;
    font-family: 'Consolas', 'Lucida Console', 'Courier New', monospace;
    font-size: clamp(11px, 0.9vw, 15px);
    letter-spacing: 0.02em;
`;

export const BoardTop = styled.header`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding-bottom: 14px;
    border-bottom: 2px solid ${boardColors.header};
    margin-bottom: 18px;
`;

export const BoardTitle = styled.h1`
    font-family: inherit;
    font-size: 1.9em;
    color: ${boardColors.header};
    letter-spacing: 0.18em;
    font-weight: 700;
`;

export const Counters = styled.div`
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
`;

const CounterWrapper = styled.div`
    text-align: right;
`;

const CounterValue = styled.div`
    font-size: 1.9em;
    font-weight: 700;
    color: ${({ $color }) => $color};
`;

const CounterLabel = styled.div`
    font-size: 0.78em;
    color: ${boardColors.muted};
`;

export function Counter({ label, value, color = boardColors.text }) {
    return (
        <CounterWrapper>
            <CounterValue $color={color}>{value}</CounterValue>
            <CounterLabel>{label}</CounterLabel>
        </CounterWrapper>
    );
}

export const Section = styled.section`
    background: ${boardColors.panel};
    border: 1px solid ${boardColors.line};
    border-top: 3px solid ${({ $accent }) => $accent};
    border-radius: 4px;
    margin-bottom: 20px;
    container-type: inline-size;
    min-width: 0;

    /* Lado a lado: a lista rotativa acompanha a rolagem da página enquanto a lista fixa desce. */
    @media only screen and (min-width: 1200px) {
        ${({ $sticky }) => ($sticky ? 'position: sticky; top: 12px;' : '')}
    }
`;

// Telas grandes: as duas listas lado a lado. Telas menores: uma sobre a outra.
export const Layout = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 0 20px;
    align-items: start;

    @media only screen and (min-width: 1200px) {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
`;

export const SectionHead = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 0.8em 1em;
    color: ${({ $accent }) => $accent};
    font-weight: 700;
    letter-spacing: 0.14em;
`;

export const Columns = styled(Row)`
    cursor: default;
    padding-top: 0.2em;
    padding-bottom: 0.5em;
    color: ${boardColors.muted};
    font-size: 0.78em;
    letter-spacing: 0.16em;
    border-bottom: 1px solid ${boardColors.line};

    &:hover {
        background: transparent;
    }
`;

export const Scroll = styled.div`
    max-height: ${({ $maxHeight }) => $maxHeight || 'none'};
    overflow-y: auto;
    scrollbar-color: ${boardColors.line} transparent;
`;

export const Banner = styled.div`
    padding: 1.1em 1em;
    color: ${boardColors.ok};
    letter-spacing: 0.12em;
    font-weight: 700;
`;

const ClockText = styled.div`
    font-size: 1.9em;
    color: ${boardColors.header};
    font-weight: 700;
    text-align: right;
`;

const ClockDate = styled.div`
    font-size: 0.78em;
    color: ${boardColors.muted};
    text-align: right;
`;

// Relógio isolado: re-renderiza a cada segundo sem tocar nas linhas do quadro.
export function Clock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            <ClockText>{now.toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza' })}</ClockText>
            <ClockDate>{now.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza', weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}</ClockDate>
        </div>
    );
}
