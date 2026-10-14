import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaMoon, FaSun } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';
import { THEME_OPTIONS, tokens, useTheme } from '../../ui';

const { colors } = tokens;

const abre = keyframes`
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Wrapper = styled.div`
    position: relative;
`;

const Botao = styled.button`
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: ${({ $aberto }) => ($aberto ? colors.neutralBg : 'transparent')};
    color: ${colors.text};
    font-size: 18px;
    cursor: pointer;
    transition: background 0.15s, transform 0.25s;

    &:hover {
        background: ${colors.neutralBg};
    }

    &:active {
        transform: rotate(25deg);
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
    }
`;

const Menu = styled.div`
    position: absolute;
    right: 0;
    top: 48px;
    width: 190px;
    padding: 6px;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 14px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
    z-index: 60;
    animation: ${abre} 0.14s ease-out;
`;

const Opcao = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border: 0;
    border-radius: 9px;
    background: ${({ $ativo }) => ($ativo ? colors.neutralBg : 'transparent')};
    color: ${colors.text};
    font-weight: ${({ $ativo }) => ($ativo ? 700 : 500)};
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${colors.neutralBg};
    }

    .ok {
        margin-left: auto;
        color: ${colors.primary};
        font-size: 0.85em;
    }
`;

/** Botão do tema na barra superior: claro, escuro ou automático (segue o sistema). */
export default function ThemeToggle() {
    const { mode, resolved, setMode } = useTheme();
    const [aberto, setAberto] = useState(false);
    const raiz = useRef(null);

    useEffect(() => {
        if (!aberto) return undefined;
        const fora = (evento) => raiz.current && !raiz.current.contains(evento.target) && setAberto(false);
        const esc = (evento) => evento.key === 'Escape' && setAberto(false);
        document.addEventListener('mousedown', fora);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', fora);
            document.removeEventListener('keydown', esc);
        };
    }, [aberto]);

    return (
        <Wrapper ref={raiz}>
            <Botao type="button" $aberto={aberto} aria-label="Alterar tema" aria-expanded={aberto} title="Tema" onClick={() => setAberto((valor) => !valor)}>
                {resolved === 'dark' ? <FaMoon /> : <FaSun />}
            </Botao>

            {aberto && (
                <Menu role="menu">
                    {THEME_OPTIONS.map((opcao) => {
                        const Icone = opcao.icon;
                        return (
                            <Opcao
                                key={opcao.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={mode === opcao.id}
                                $ativo={mode === opcao.id}
                                onClick={() => {
                                    setMode(opcao.id);
                                    setAberto(false);
                                }}
                            >
                                <Icone /> {opcao.label}
                                {mode === opcao.id && <FaCheck className="ok" />}
                            </Opcao>
                        );
                    })}
                </Menu>
            )}
        </Wrapper>
    );
}
