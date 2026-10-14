import { FaEdit, FaEye, FaTrashAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { tokens } from './tokens';

const { colors } = tokens;

const Grupo = styled.div`
    display: inline-flex;
    gap: 4px;
    justify-content: flex-end;
`;

const Botao = styled.button`
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: ${colors.muted};
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;

    &:hover {
        transform: translateY(-1px);
        background: ${({ $tom }) => ({ azul: colors.infoBg, verde: colors.successBg, vermelho: colors.dangerBg }[$tom] ?? colors.neutralBg)};
        color: ${({ $tom }) => ({ azul: colors.info, verde: colors.success, vermelho: colors.danger }[$tom] ?? colors.text)};
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
    }
`;

/**
 * Ações de uma linha de tabela (ver, editar, excluir) com ícones e dicas.
 * Cada clique para a propagação para não abrir a linha ao mesmo tempo.
 */
export function RowActions({ onVer, onEditar, onExcluir, extras = [] }) {
    const acao = (rotulo, tom, Icone, executar) => (
        <Botao
            key={rotulo}
            type="button"
            $tom={tom}
            title={rotulo}
            aria-label={rotulo}
            onClick={(evento) => {
                evento.stopPropagation();
                executar();
            }}
        >
            <Icone />
        </Botao>
    );

    return (
        <Grupo>
            {onVer && acao('Ver detalhes', 'azul', FaEye, onVer)}
            {onEditar && acao('Editar', 'verde', FaEdit, onEditar)}
            {extras.map((extra) => acao(extra.rotulo, extra.tom, extra.icon, extra.onClick))}
            {onExcluir && acao('Excluir', 'vermelho', FaTrashAlt, onExcluir)}
        </Grupo>
    );
}
