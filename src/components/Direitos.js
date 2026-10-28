import styled from 'styled-components';

const ano = new Date().getFullYear();

const Texto = styled.p`
    margin: 18px 0 4px;
    text-align: center;
    font-size: 0.78rem;
    color: var(--c-muted, #6b7280);

    /* No login fica no pé da tela, fora do fluxo, para não empurrar o formulário. */
    ${(p) => p.$rodape && `
        position: absolute;
        left: 0;
        right: 0;
        bottom: 18px;
        margin: 0;
        padding: 0 16px;
        pointer-events: none;
    `}
`;

/** Aviso de direitos autorais: no rodapé das telas internas e, com `rodape`, no pé da tela de login. */
export default function Direitos({ rodape = false }) {
    return <Texto $rodape={rodape}>© {ano > 2026 ? `2026–${ano}` : '2026'} WFCore. Todos os direitos reservados.</Texto>;
}
