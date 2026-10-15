import { useCallback, useState } from 'react';

const CHAVE = 'jpl.sicredi.postosExtras';

const ler = () => {
    try {
        return window.localStorage.getItem(CHAVE) ?? '';
    } catch {
        return '';
    }
};

/** Postos adicionais do convênio (boletos antigos emitidos em outro posto), lembrados neste navegador. */
export function usePostosExtras() {
    const [texto, setTexto] = useState(ler);

    const alterar = useCallback((valor) => {
        const limpo = valor.replace(/[^\d,\s]/g, '');
        setTexto(limpo);
        try {
            window.localStorage.setItem(CHAVE, limpo);
        } catch {
            // sem armazenamento: vale só nesta tela
        }
    }, []);

    const postos = [...new Set(texto.split(/[\s,]+/).map((p) => p.trim()).filter((p) => /^\d{1,2}$/.test(p)).map((p) => p.padStart(2, '0')))];

    return { texto, alterar, postos };
}
