import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { Button } from './Button';
import { tokens } from './tokens';

const { colors } = tokens;

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const rise = keyframes`
    from { opacity: 0; transform: translateY(14px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const sheet = keyframes`
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(17, 20, 26, 0.55);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10000;
    animation: ${fadeIn} 0.15s ease-out;

    @media (max-width: 640px) {
        align-items: flex-end;
        padding: 0;
    }
`;

const Box = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: ${({ $width }) => $width}px;
    max-height: min(90vh, 900px);
    background: ${colors.surface};
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: ${rise} 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);

    @media (max-width: 640px) {
        max-width: none;
        max-height: 92vh;
        border-radius: 18px 18px 0 0;
        animation: ${sheet} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
`;

const Header = styled.header`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid ${colors.border};
    background: ${({ $accent }) => $accent || colors.surface};
`;

const HeaderText = styled.div`
    flex: 1;
    min-width: 0;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.3;
    color: ${colors.text};
    word-break: break-word;
`;

const Subtitle = styled.div`
    margin-top: 3px;
    font-size: 0.88rem;
    color: ${colors.muted};
`;

const CloseButton = styled.button`
    flex: none;
    width: 34px;
    height: 34px;
    margin: -4px -6px 0 0;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: ${colors.muted};
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
        background: ${colors.neutralBg};
        color: ${colors.text};
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
    }
`;

const Body = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 20px 20px;
`;

const Footer = styled.footer`
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid ${colors.border};
    background: ${colors.background};
`;

// Várias janelas podem estar abertas ao mesmo tempo (ex.: o cadastro rápido dentro do formulário de uma conta). A rolagem da
// página só volta quando a ÚLTIMA fecha, em qualquer ordem, e só a janela de cima responde ao Esc. (Antes cada janela guardava o
// "estado anterior" ao abrir: se fechassem fora de ordem, a página ficava sem barra de rolagem até recarregar.)
const abertas = [];
let overflowOriginal = '';

function travarRolagem(id) {
    if (abertas.length === 0) {
        overflowOriginal = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    abertas.push(id);
}

function liberarRolagem(id) {
    const posicao = abertas.indexOf(id);
    if (posicao >= 0) abertas.splice(posicao, 1);
    if (abertas.length === 0) document.body.style.overflow = overflowOriginal;
}

/**
 * Faz uma janela se comportar como modal: trava a rolagem da página enquanto estiver aberta e responde ao Esc só quando é a
 * de cima. Usado pelo Dialog e por outras janelas (como o visualizador de imagens).
 */
export function useJanelaModal(open, onClose) {
    const idDaJanela = useId();
    // onClose costuma ser uma função nova a cada renderização: guardada à parte para não refazer a trava da rolagem toda vez.
    const onCloseAtual = useRef(onClose);
    onCloseAtual.current = onClose;

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => {
            if (event.key === 'Escape' && abertas[abertas.length - 1] === idDaJanela) onCloseAtual.current?.();
        };
        // Evita a página rolar atrás do modal.
        travarRolagem(idDaJanela);

        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            liberarRolagem(idDaJanela);
        };
    }, [open, idDaJanela]);
}

/**
 * Modal padrão do sistema: cabeçalho com título e botão de fechar, corpo rolável e rodapé fixo.
 * No celular vira uma "gaveta" que sobe da base da tela. Fecha com Esc ou clicando fora.
 */
export function Dialog({ open, title, subtitle, onClose, children, footer, width = 520, accent }) {
    const titleId = useId();
    useJanelaModal(open, onClose);

    if (!open) return null;

    // Portal para o <body>: um ancestral com transform/animação (a página) faria o "fixed" se
    // comportar como "absolute" e o modal ficaria fora da área visível em páginas longas.
    return createPortal(
        <Overlay onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
            <Box role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} $width={width}>
                {(title || onClose) && (
                    <Header $accent={accent}>
                        <HeaderText>
                            {title && <Title id={titleId}>{title}</Title>}
                            {subtitle && <Subtitle>{subtitle}</Subtitle>}
                        </HeaderText>
                        {onClose && <CloseButton type="button" aria-label="Fechar" onClick={onClose}>×</CloseButton>}
                    </Header>
                )}
                <Body>{children}</Body>
                {footer && <Footer>{footer}</Footer>}
            </Box>
        </Overlay>,
        document.body,
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, loading = false, onConfirm, onClose }) {
    return (
        <Dialog
            open={open}
            title={title}
            onClose={loading ? undefined : onClose}
            width={440}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
                </>
            }
        >
            <p style={{ color: colors.text, lineHeight: 1.55, margin: 0 }}>{message}</p>
        </Dialog>
    );
}
