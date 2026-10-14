import styled, { css, keyframes } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { tokens } from '../../ui/tokens';

const { colors } = tokens;

export const SIDEBAR_WIDTH = 248;
const MOBILE = `(max-width: ${tokens.breakpoint})`;

const shell = {
    sidebar: '#14171C',
    sidebarBorder: 'rgba(255, 255, 255, 0.07)',
    sidebarText: '#AEB6C2',
    sidebarTextStrong: '#F4F6F8',
    sidebarHover: 'rgba(255, 255, 255, 0.06)',
};

export const Frame = styled.div`
    min-height: 100vh;
    background: ${colors.background};
`;

/* ───────────── Menu lateral ───────────── */

export const SidebarPanel = styled.aside`
    position: fixed;
    inset: 0 auto 0 0;
    width: ${SIDEBAR_WIDTH}px;
    background: ${shell.sidebar};
    border-right: 1px solid ${shell.sidebarBorder};
    display: flex;
    flex-direction: column;
    z-index: 40;
    transition: transform 0.22s ease;

    @media ${MOBILE} {
        transform: translateX(${(p) => (p.$open ? '0' : '-100%')});
        box-shadow: ${(p) => (p.$open ? '0 0 40px rgba(0,0,0,0.45)' : 'none')};
    }
`;

export const Backdrop = styled.div`
    display: none;

    @media ${MOBILE} {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 30;
    }
`;

export const Brand = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 18px 20px;
    background: none;
    border: 0;
    border-bottom: 1px solid ${shell.sidebarBorder};
    cursor: pointer;
    text-align: left;

    img {
        width: 38px;
        height: 38px;
        object-fit: contain;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.92);
        padding: 3px;
    }

    strong {
        display: block;
        color: ${shell.sidebarTextStrong};
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        line-height: 1.1;
    }

    span {
        display: block;
        margin-top: 2px;
        color: ${shell.sidebarText};
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }
`;

export const Nav = styled.nav`
    flex: 1;
    overflow-y: auto;
    padding: 12px 12px 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
`;

export const NavSectionTitle = styled.div`
    margin: 16px 10px 6px;
    color: ${shell.sidebarText};
    opacity: 0.7;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
`;

export const NavItem = styled(NavLink)`
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 2px;
    border-radius: 8px;
    color: ${shell.sidebarText};
    font-family: 'Open Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;

    svg {
        font-size: 18px;
        flex: none;
    }

    &:hover {
        background: ${shell.sidebarHover};
        color: ${shell.sidebarTextStrong};
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
        outline-offset: 1px;
    }

    &.active {
        background: rgba(211, 47, 47, 0.16);
        color: ${shell.sidebarTextStrong};

        svg {
            color: #ff6b6b;
        }

        &::before {
            content: '';
            position: absolute;
            left: -12px;
            top: 8px;
            bottom: 8px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: ${colors.primary};
        }
    }
`;

export const SubMenu = styled.div`
    margin: 2px 0 8px 22px;
    padding-left: 10px;
    border-left: 1px solid ${shell.sidebarBorder};
    display: grid;
    gap: 1px;
`;

export const SubItem = styled(NavLink)`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 8px;
    color: ${shell.sidebarText};
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;

    svg {
        font-size: 13px;
        flex: none;
        opacity: 0.85;
    }

    &:hover {
        background: ${shell.sidebarHover};
        color: ${shell.sidebarTextStrong};
    }

    &.active {
        background: rgba(229, 72, 77, 0.16);
        color: ${shell.sidebarTextStrong};

        svg {
            color: #ff7b7b;
            opacity: 1;
        }
    }
`;

export const ContadorMenu = styled.span`
    margin-left: auto;
    min-width: 22px;
    padding: 1px 7px;
    border-radius: 999px;
    background: ${colors.primary};
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    text-align: center;
`;

export const SidebarFooter = styled.div`
    padding: 12px;
    border-top: 1px solid ${shell.sidebarBorder};
`;

export const UserChip = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border-radius: 10px;
    color: ${shell.sidebarTextStrong};

    .perfil {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
    }

    .perfil:hover {
        background: ${shell.sidebarHover};
    }

    .info {
        min-width: 0;
        flex: 1;
    }

    .name {
        display: block;
        font-size: 13.5px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .role {
        display: block;
        font-size: 11.5px;
        color: ${shell.sidebarText};
    }
`;

export const IconButton = styled.button`
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 17px;
    cursor: pointer;
    transition: background 0.15s;
    position: relative;

    &:hover {
        background: ${shell.sidebarHover};
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
    }
`;

/* ───────────── Barra superior ───────────── */

export const Column = styled.div`
    margin-left: ${SIDEBAR_WIDTH}px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    min-width: 0;

    @media ${MOBILE} {
        margin-left: 0;
    }
`;

export const TopbarBar = styled.header`
    position: sticky;
    top: 0;
    z-index: 20;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    background: ${colors.surface};
    border-bottom: 1px solid ${colors.border};

    @media ${MOBILE} {
        padding: 0 12px;
    }
`;

export const MenuButton = styled(IconButton)`
    display: none;
    color: ${colors.text};

    &:hover {
        background: ${colors.neutralBg};
    }

    @media ${MOBILE} {
        display: grid;
    }
`;

export const TopbarSpacer = styled.div`
    flex: 1;
`;

export const BellButton = styled(IconButton)`
    color: ${colors.text};
    font-size: 19px;

    &:hover {
        background: ${colors.neutralBg};
    }
`;

export const BellBadge = styled.span`
    position: absolute;
    top: 2px;
    right: 1px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 9px;
    background: ${colors.primary};
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    line-height: 17px;
    text-align: center;
`;

export const Content = styled.main`
    flex: 1;
    min-width: 0;
`;

const entrada = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
`;

/** Cada troca de rota entra com um fade curto. */
export const PageTransition = styled.div`
    animation: ${entrada} 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

/* ───────────── Busca global ───────────── */

const pop = keyframes`
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
`;

export const SearchWrap = styled.div`
    position: relative;
    flex: 0 1 460px;
    min-width: 0;
`;

export const SearchField = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid ${colors.border};
    background: ${colors.background};
    color: ${colors.muted};
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;

    &:focus-within {
        background: ${colors.surface};
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.12);
    }

    input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: ${colors.text};
        font-size: 14px;
    }

    kbd {
        flex: none;
        padding: 1px 6px;
        border-radius: 5px;
        border: 1px solid ${colors.border};
        background: ${colors.surface};
        color: ${colors.muted};
        font-size: 11px;
        font-family: inherit;

        @media ${MOBILE} {
            display: none;
        }
    }
`;

export const SearchResults = styled.div`
    position: absolute;
    top: 46px;
    left: 0;
    right: 0;
    max-height: 70vh;
    overflow-y: auto;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
    padding: 6px;
    animation: ${pop} 0.12s ease-out;
`;

export const ResultGroup = styled.div`
    padding: 8px 10px 4px;
    color: ${colors.muted};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
`;

export const ResultItem = styled.button`
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: ${colors.text};

    strong {
        font-size: 14px;
    }

    span {
        font-size: 12.5px;
        color: ${colors.muted};
    }

    ${(p) => p.$active && css`
        background: ${colors.neutralBg};
    `}

    &:hover {
        background: ${colors.neutralBg};
    }
`;

export const SearchHint = styled.div`
    padding: 14px 12px;
    color: ${colors.muted};
    font-size: 13.5px;
`;
