import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { tokens } from './tokens';

const { colors } = tokens;

const Wrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
`;

const Label = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${colors.text};
`;

const Field = styled.div`
    position: relative;

    input {
        box-sizing: border-box;
        width: 100%;
        padding: 10px 34px 10px 12px;
        font-size: 0.95rem;
        font-family: inherit;
        border: 1px solid ${colors.border};
        border-radius: ${tokens.radius};
        background: ${colors.surface};
        color: ${colors.text};
        outline: none;

        &:focus {
            border-color: ${colors.primary};
            box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.12);
        }
    }

    button {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: ${colors.muted};
        font-size: 18px;
        cursor: pointer;

        &:hover {
            background: ${colors.neutralBg};
        }
    }
`;

const List = styled.ul`
    position: absolute;
    z-index: 50;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 260px;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: ${colors.surface};
    border: 1px solid ${colors.border};
    border-radius: 10px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
`;

const Option = styled.li`
    padding: 8px 10px;
    border-radius: 7px;
    cursor: pointer;
    background: ${({ $active }) => ($active ? colors.neutralBg : 'transparent')};
    color: ${colors.text};

    small {
        display: block;
        color: ${colors.muted};
        font-size: 0.78rem;
    }
`;

const Empty = styled.li`
    padding: 10px;
    color: ${colors.muted};
    font-size: 0.9rem;
`;

const CadastrarOpcao = styled.li`
    margin-top: 4px;
    padding: 9px 10px;
    border-top: 1px solid ${colors.border};
    border-radius: 0 0 7px 7px;
    cursor: pointer;
    color: ${colors.primary};
    font-weight: 700;
    font-size: 0.9rem;

    &:hover {
        background: ${colors.neutralBg};
    }
`;

/**
 * Seleção com busca (autocompletar). `cadastrar` ({ rotulo, onClick(textoDigitado) }) acrescenta no fim da lista a opção de cadastrar
 * um novo item sem sair da tela. `fetcher(termo)` devolve [{ value, label, hint? }].
 * `selected` é { value, label } do item escolhido (para exibir o nome sem nova consulta).
 */
export default function Combobox({ label, placeholder = 'Buscar…', fetcher, selected, onChange, queryKey, minChars = 0, error, hint, required = false, disabled = false, cadastrar }) {
    const id = useId();
    const rootRef = useRef(null);
    const [aberto, setAberto] = useState(false);
    const [texto, setTexto] = useState('');
    const [ativo, setAtivo] = useState(0);
    const termo = useDebouncedValue(texto.trim(), 250);

    const consulta = useQuery({
        queryKey: ['combobox', queryKey, termo],
        queryFn: () => fetcher(termo),
        enabled: aberto && termo.length >= minChars,
        staleTime: 30 * 1000,
    });
    const opcoes = consulta.data ?? [];

    useEffect(() => {
        const fechar = (evento) => {
            if (rootRef.current && !rootRef.current.contains(evento.target)) {
                setAberto(false);
                setTexto('');
            }
        };
        document.addEventListener('mousedown', fechar);
        return () => document.removeEventListener('mousedown', fechar);
    }, []);

    useEffect(() => setAtivo(0), [termo]);

    const escolher = (opcao) => {
        onChange(opcao ? opcao.value : '', opcao ?? null);
        setAberto(false);
        setTexto('');
    };

    const teclado = (evento) => {
        if (evento.key === 'ArrowDown') {
            evento.preventDefault();
            setAberto(true);
            setAtivo((atual) => Math.min(atual + 1, Math.max(opcoes.length - 1, 0)));
        } else if (evento.key === 'ArrowUp') {
            evento.preventDefault();
            setAtivo((atual) => Math.max(atual - 1, 0));
        } else if (evento.key === 'Enter' && aberto && opcoes[ativo]) {
            evento.preventDefault();
            escolher(opcoes[ativo]);
        } else if (evento.key === 'Escape') {
            setAberto(false);
            setTexto('');
        }
    };

    return (
        <Wrapper ref={rootRef}>
            {label && <Label htmlFor={id}>{label}{required && <span style={{ color: 'var(--c-danger)' }}> *</span>}</Label>}
            <Field>
                <input
                    id={id}
                    type="text"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={aberto}
                    aria-controls={`${id}-lista`}
                    aria-autocomplete="list"
                    placeholder={selected ? selected.label : placeholder}
                    value={aberto ? texto : selected?.label ?? ''}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    style={error ? { borderColor: 'var(--c-danger)' } : undefined}
                    onFocus={() => !disabled && setAberto(true)}
                    onChange={(evento) => {
                        setTexto(evento.target.value);
                        setAberto(true);
                    }}
                    onKeyDown={teclado}
                />
                {selected && !disabled && (
                    <button type="button" aria-label="Limpar seleção" onClick={() => escolher(null)}>×</button>
                )}
            </Field>
            {error ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--c-danger)' }}>{error}</span>
            ) : hint ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>{hint}</span>
            ) : null}

            {aberto && (
                <List id={`${id}-lista`} role="listbox">
                    {consulta.isFetching && opcoes.length === 0 && <Empty>Buscando…</Empty>}
                    {!consulta.isFetching && opcoes.length === 0 && <Empty>{termo.length < minChars ? `Digite ao menos ${minChars} letras.` : 'Nada encontrado.'}</Empty>}
                    {opcoes.map((opcao, indice) => (
                        <Option
                            key={opcao.value}
                            role="option"
                            aria-selected={selected?.value === opcao.value}
                            $active={indice === ativo}
                            onMouseEnter={() => setAtivo(indice)}
                            onMouseDown={(evento) => {
                                evento.preventDefault();
                                escolher(opcao);
                            }}
                        >
                            {opcao.label}
                            {opcao.hint && <small>{opcao.hint}</small>}
                        </Option>
                    ))}
                    {cadastrar && (
                        <CadastrarOpcao
                            role="option"
                            aria-selected={false}
                            onMouseDown={(evento) => {
                                evento.preventDefault();
                                const digitado = texto.trim();
                                setAberto(false);
                                setTexto('');
                                cadastrar.onClick(digitado);
                            }}
                        >
                            + {cadastrar.rotulo}
                            {texto.trim() ? ` “${texto.trim()}”` : ''}
                        </CadastrarOpcao>
                    )}
                </List>
            )}
        </Wrapper>
    );
}
