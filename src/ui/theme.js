import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { MdBrightnessAuto } from 'react-icons/md';

// ── Variáveis CSS do tema ────────────────────────────────────────────────────
// Todo componente usa `var(--...)` via tokens; trocar o atributo data-theme em <html> troca o visual inteiro.

export const themeCss = `
:root, :root[data-theme='light'] {
    color-scheme: light;
    --c-primary: #D32F2F;
    --c-primary-hover: #B71C1C;
    --c-text: #2B2F36;
    --c-muted: #6B7280;
    --c-border: #DDE1E7;
    --c-surface: #FFFFFF;
    --c-surface-alt: #F6F7F9;
    --c-bg: #F3F4F7;
    --c-row-hover: #FFF6F6;
    --c-success: #2E7D32;
    --c-success-bg: #E8F5E9;
    --c-warning: #B26A00;
    --c-warning-bg: #FFF3E0;
    --c-danger: #C62828;
    --c-danger-bg: #FDECEA;
    --c-info: #1565C0;
    --c-info-bg: #E3F2FD;
    --c-neutral-bg: #ECEEF1;
    --c-overlay: rgba(17, 20, 26, 0.55);
    --c-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);

    --p-red-fg: #C62828;    --p-red-bg: #FDECEA;
    --p-green-fg: #2E7D32;  --p-green-bg: #E8F5E9;
    --p-blue-fg: #1565C0;   --p-blue-bg: #E3F2FD;
    --p-orange-fg: #E65100; --p-orange-bg: #FFF3E0;
    --p-purple-fg: #6A1B9A; --p-purple-bg: #F3E5F5;
    --p-teal-fg: #00796B;   --p-teal-bg: #E0F2F1;
    --p-gray-fg: #455A64;   --p-gray-bg: #ECEFF1;

    /* Painel de usinas (quadro de embarque) — versão clara */
    --b-bg: #EEF1F5;
    --b-panel: #FFFFFF;
    --b-line: #D9DFE7;
    --b-tile-top: #FFFFFF;
    --b-tile-bottom: #EDF1F6;
    --b-header: #B36B00;
    --b-text: #1E2630;
    --b-muted: #637083;
    --b-ok: #1B8F4B;
    --b-standby: #0277BD;
    --b-alert: #E65100;
    --b-danger: #D32F2F;
    --b-neutral: #607D8B;
    --b-soft: rgba(0, 0, 0, 0.04);
}

:root[data-theme='dark'] {
    color-scheme: dark;
    --c-primary: #E5484D;
    --c-primary-hover: #F2656A;
    --c-text: #E7EBF1;
    --c-muted: #9AA6B6;
    --c-border: #2B333F;
    --c-surface: #171C23;
    --c-surface-alt: #1D232C;
    --c-bg: #0E1217;
    --c-row-hover: #21262F;
    --c-success: #5FD068;
    --c-success-bg: #14301C;
    --c-warning: #FFB74D;
    --c-warning-bg: #35280F;
    --c-danger: #FF6B6B;
    --c-danger-bg: #3B1A1A;
    --c-info: #64B5F6;
    --c-info-bg: #12263B;
    --c-neutral-bg: #252C36;
    --c-overlay: rgba(0, 0, 0, 0.65);
    --c-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4);

    --p-red-fg: #FF7B7B;    --p-red-bg: #3B1A1A;
    --p-green-fg: #6EDC78;  --p-green-bg: #14301C;
    --p-blue-fg: #7BBBFF;   --p-blue-bg: #12263B;
    --p-orange-fg: #FFB060; --p-orange-bg: #35280F;
    --p-purple-fg: #D296EE; --p-purple-bg: #2C1A38;
    --p-teal-fg: #5DD3C4;   --p-teal-bg: #0F2F2B;
    --p-gray-fg: #B0BEC5;   --p-gray-bg: #262E37;

    --b-bg: #0A0E13;
    --b-panel: #10161D;
    --b-line: #1E2933;
    --b-tile-top: #1D2733;
    --b-tile-bottom: #151D26;
    --b-header: #FFC857;
    --b-text: #F2F6FA;
    --b-muted: #8A99AB;
    --b-ok: #3DDC84;
    --b-standby: #4FC3F7;
    --b-alert: #FFA726;
    --b-danger: #FF5252;
    --b-neutral: #90A4AE;
    --b-soft: rgba(255, 255, 255, 0.04);
}
`;

// ── Estado do tema ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'jpl-theme';
const ThemeContext = createContext({ mode: 'system', resolved: 'light', setMode: () => undefined });

const lerPreferencia = () => {
    try {
        const valor = window.localStorage.getItem(STORAGE_KEY);
        return ['light', 'dark', 'system'].includes(valor) ? valor : 'system';
    } catch {
        return 'system';
    }
};

const sistemaEscuro = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

export function ThemeProvider({ children }) {
    const [mode, setModeState] = useState(lerPreferencia);
    const [escuroNoSistema, setEscuroNoSistema] = useState(sistemaEscuro);

    // Acompanha a troca de tema do sistema operacional quando o modo é "sistema".
    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!media) return undefined;
        const aoMudar = () => setEscuroNoSistema(media.matches);
        media.addEventListener('change', aoMudar);
        return () => media.removeEventListener('change', aoMudar);
    }, []);

    const resolved = mode === 'system' ? (escuroNoSistema ? 'dark' : 'light') : mode;

    useEffect(() => {
        document.documentElement.dataset.theme = resolved;
    }, [resolved]);

    const setMode = useCallback((novo) => {
        setModeState(novo);
        try {
            window.localStorage.setItem(STORAGE_KEY, novo);
        } catch {
            // sem armazenamento: vale só para esta sessão
        }
    }, []);

    const valor = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

    return createElement(ThemeContext.Provider, { value: valor }, children);
}

export const useTheme = () => useContext(ThemeContext);

export const THEME_OPTIONS = [
    { id: 'light', label: 'Claro', icon: FaSun },
    { id: 'dark', label: 'Escuro', icon: FaMoon },
    { id: 'system', label: 'Automático', icon: MdBrightnessAuto },
];
