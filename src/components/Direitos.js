import styled from 'styled-components';

const ano = new Date().getFullYear();

const Texto = styled.p`
    margin: 18px 0 4px;
    text-align: center;
    font-size: 0.78rem;
    color: var(--c-muted, #6b7280);
`;

/** Aviso de direitos autorais, mostrado no login e no rodapé das telas internas. */
export default function Direitos() {
    return <Texto>© {ano > 2026 ? `2026–${ano}` : '2026'} WFCore. Todos os direitos reservados.</Texto>;
}
