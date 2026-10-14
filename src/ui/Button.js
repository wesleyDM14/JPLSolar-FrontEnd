import styled, { css } from 'styled-components';
import { Spinner } from './layout';
import { tokens } from './tokens';

const { colors } = tokens;

const variants = {
    primary: css`
        background: linear-gradient(135deg, #E53935, ${colors.primary});
        color: #fff;
        border: 1px solid ${colors.primary};
        box-shadow: 0 2px 8px rgba(211, 47, 47, 0.28);
        &:hover:not(:disabled) {
            background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover});
            box-shadow: 0 4px 14px rgba(211, 47, 47, 0.38);
        }
    `,
    secondary: css`
        background: ${colors.surface};
        color: ${colors.text};
        border: 1px solid ${colors.border};
        &:hover:not(:disabled) { background: ${colors.neutralBg}; }
    `,
    danger: css`
        background: ${colors.surface};
        color: ${colors.danger};
        border: 1px solid ${colors.danger};
        &:hover:not(:disabled) { background: ${colors.dangerBg}; }
    `,
    ghost: css`
        background: transparent;
        color: ${colors.text};
        border: 1px solid transparent;
        &:hover:not(:disabled) { background: ${colors.neutralBg}; }
    `,
};

const StyledButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: ${({ $size }) => ($size === 'sm' ? '6px 12px' : '10px 18px')};
    font-size: ${({ $size }) => ($size === 'sm' ? '0.85rem' : '0.95rem')};
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s, border-color 0.15s;

    svg {
        font-size: 1.1em;
    }

    &:active:not(:disabled) {
        transform: translateY(1px) scale(0.99);
    }

    &:focus-visible {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
    }
    ${({ $variant }) => variants[$variant]}

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

export function Button({ variant = 'primary', size = 'md', loading = false, icon, children, disabled, type = 'button', ...props }) {
    return (
        <StyledButton $variant={variant} $size={size} type={type} disabled={disabled || loading} {...props}>
            {loading ? <Spinner $size={14} /> : icon}
            {children}
        </StyledButton>
    );
}
