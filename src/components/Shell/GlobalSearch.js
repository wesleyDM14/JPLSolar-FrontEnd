import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { clientesApi, usinasApi } from '../../api/resources';
import { formatDocumento } from '../../utils/masks';
import { ResultGroup, ResultItem, SearchField, SearchHint, SearchResults, SearchWrap } from './shell.styles';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

function useDebounced(value, delay) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

/** Busca rápida por cliente (nome, CPF/CNPJ) e usina (código, local), de qualquer tela. Atalho: Ctrl+K ou "/". */
export default function GlobalSearch() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const wrapRef = useRef(null);
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const term = useDebounced(text.trim(), DEBOUNCE_MS);
    const enabled = term.length >= MIN_CHARS;

    const clientes = useQuery({
        queryKey: ['busca', 'clientes', term],
        queryFn: () => clientesApi.list({ search: term, pageSize: 5 }),
        enabled,
        staleTime: 30 * 1000,
    });
    const usinas = useQuery({
        queryKey: ['busca', 'usinas', term],
        queryFn: () => usinasApi.list({ search: term, pageSize: 5 }),
        enabled,
        staleTime: 30 * 1000,
    });

    const results = useMemo(() => {
        if (!enabled) return [];

        const list = [];
        (clientes.data?.data ?? []).forEach((cliente) => {
            list.push({
                key: `c-${cliente.id}`,
                group: 'Clientes',
                title: cliente.nome,
                detail: cliente.documento ? formatDocumento(cliente.documento) : cliente.email ?? '',
                path: `/clientes/${cliente.id}`,
            });
        });
        (usinas.data?.data ?? []).forEach((usina) => {
            list.push({
                key: `u-${usina.id}`,
                group: 'Usinas',
                title: usina.code,
                detail: [usina.client?.nome, usina.cidade ?? usina.local].filter(Boolean).join(' · '),
                path: `/usinas/${usina.id}`,
            });
        });
        return list;
    }, [enabled, clientes.data, usinas.data]);

    const loading = enabled && (clientes.isFetching || usinas.isFetching);

    useEffect(() => {
        setActive(0);
    }, [term]);

    // Atalhos de teclado e fechar ao clicar fora.
    useEffect(() => {
        const onKey = (event) => {
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
            } else if (event.key === '/' && !typing) {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };
        const onClick = (event) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, []);

    const go = (item) => {
        setOpen(false);
        setText('');
        navigate(item.path);
    };

    const onInputKey = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Enter' && results[active]) {
            event.preventDefault();
            go(results[active]);
        }
    };

    let lastGroup = '';

    return (
        <SearchWrap ref={wrapRef}>
            <SearchField>
                <FaSearch aria-hidden />
                <input
                    ref={inputRef}
                    type="search"
                    value={text}
                    placeholder="Buscar cliente, CPF/CNPJ ou usina…"
                    aria-label="Busca global"
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setText(event.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={onInputKey}
                />
                <kbd>Ctrl K</kbd>
            </SearchField>

            {open && text.trim().length > 0 && (
                <SearchResults role="listbox">
                    {!enabled && <SearchHint>Digite ao menos {MIN_CHARS} caracteres.</SearchHint>}
                    {enabled && loading && results.length === 0 && <SearchHint>Buscando…</SearchHint>}
                    {enabled && !loading && results.length === 0 && <SearchHint>Nada encontrado para “{term}”.</SearchHint>}

                    {results.map((item, index) => {
                        const header = item.group !== lastGroup ? <ResultGroup>{item.group}</ResultGroup> : null;
                        lastGroup = item.group;

                        return (
                            <div key={item.key}>
                                {header}
                                <ResultItem
                                    type="button"
                                    role="option"
                                    aria-selected={index === active}
                                    $active={index === active}
                                    onMouseEnter={() => setActive(index)}
                                    onClick={() => go(item)}
                                >
                                    <strong>{item.title}</strong>
                                    {item.detail && <span>{item.detail}</span>}
                                </ResultItem>
                            </div>
                        );
                    })}
                </SearchResults>
            )}
        </SearchWrap>
    );
}
